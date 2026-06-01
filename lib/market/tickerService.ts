import type { PlanName } from "@/lib/billing/planLimits";
import { getPlanLimits } from "@/lib/billing/planLimits";
import { getCandlesCached } from "@/lib/market/cachedCandles";
import { fetchTwelveDataPrice } from "@/lib/market/twelveData";
import { isJpyPair } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

export type TickerItem = {
  pair: string;
  price: string;
  chg: string;
  up: boolean;
  changePercent?: number;
  source: "cache" | "provider" | "latest_scan";
  updatedAt: string;
};

const quoteCache = new Map<string, { price: number; prev: number; ts: number }>();

function quoteTtlMs(plan: PlanName): number {
  const sec = getPlanLimits(plan).quoteRefreshSeconds;
  return sec > 0 ? sec * 1000 : 0;
}

async function tickerFromCachedCandles(pair: string): Promise<TickerItem | null> {
  try {
    const result = await getCandlesCached(pair, "5min", 5, { allowProvider: false });
    if (result.candles.length < 2) return null;
    const last = result.candles[result.candles.length - 1];
    const prev = result.candles[result.candles.length - 2];
    const chgPct = ((last.close - prev.close) / prev.close) * 100;
    const up = chgPct >= 0;
    const dp = isJpyPair(pair) ? 3 : 5;
    return {
      pair,
      price: last.close.toFixed(dp),
      chg: `${up ? "▲" : "▼"}${Math.abs(chgPct).toFixed(3)}%`,
      up,
      changePercent: chgPct,
      source: "cache",
      updatedAt: result.cachedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function tickerFromProvider(pair: string, plan: PlanName): Promise<TickerItem | null> {
  const ttl = quoteTtlMs(plan);
  const hit = quoteCache.get(pair);
  if (hit && ttl > 0 && Date.now() - hit.ts < ttl) {
    const chgPct = hit.prev ? ((hit.price - hit.prev) / hit.prev) * 100 : 0;
    const up = chgPct >= 0;
    const dp = isJpyPair(pair) ? 3 : 5;
    return {
      pair,
      price: hit.price.toFixed(dp),
      chg: `${up ? "▲" : "▼"}${Math.abs(chgPct).toFixed(3)}%`,
      up,
      changePercent: chgPct,
      source: "provider",
      updatedAt: new Date(hit.ts).toISOString(),
    };
  }

  try {
    const { price } = await fetchTwelveDataPrice(pair);
    const prev = hit?.price ?? price;
    quoteCache.set(pair, { price, prev, ts: Date.now() });
    const chgPct = prev ? ((price - prev) / prev) * 100 : 0;
    const up = chgPct >= 0;
    const dp = isJpyPair(pair) ? 3 : 5;
    return {
      pair,
      price: price.toFixed(dp),
      chg: `${up ? "▲" : "▼"}${Math.abs(chgPct).toFixed(3)}%`,
      up,
      changePercent: chgPct,
      source: "provider",
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return tickerFromCachedCandles(pair);
  }
}

export async function buildTickerForPairs(
  pairs: string[],
  plan: PlanName,
  options?: { fromLatestScan?: Record<string, { price: number; changePercent?: number }> }
): Promise<{ items: TickerItem[]; providerCalls: number; cacheHits: number }> {
  const limits = getPlanLimits(plan);
  let providerCalls = 0;
  let cacheHits = 0;
  const items: TickerItem[] = [];

  for (const pair of pairs) {
    const scanRow = options?.fromLatestScan?.[pair];
    if (scanRow) {
      const up = (scanRow.changePercent ?? 0) >= 0;
      const dp = isJpyPair(pair) ? 3 : 5;
      items.push({
        pair,
        price: scanRow.price.toFixed(dp),
        chg: `${up ? "▲" : "▼"}${Math.abs(scanRow.changePercent ?? 0).toFixed(3)}%`,
        up,
        changePercent: scanRow.changePercent,
        source: "latest_scan",
        updatedAt: new Date().toISOString(),
      });
      cacheHits++;
      continue;
    }

    if (limits.liveUpdateMode === "cached_only") {
      const row = await tickerFromCachedCandles(pair);
      if (row) {
        items.push(row);
        cacheHits++;
      }
      continue;
    }

    if (limits.liveUpdateMode === "quote_polling" || limits.liveUpdateMode === "full") {
      const row = await tickerFromProvider(pair, plan);
      if (row) {
        items.push(row);
        if (row.source === "provider") providerCalls++;
        else cacheHits++;
      }
      continue;
    }

    const row = await tickerFromCachedCandles(pair);
    if (row) {
      items.push(row);
      cacheHits++;
    }
  }

  return { items, providerCalls, cacheHits };
}

export async function readLatestScanTicker(
  userId: string,
  scanSessionId: string
): Promise<Record<string, { price: number; changePercent?: number }>> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
  const admin = createAdminClient();
  const { data } = await admin
    .from("signals")
    .select("pair, entry_price, raw_payload")
    .eq("user_id", userId)
    .eq("scan_session_id", scanSessionId);

  const out: Record<string, { price: number; changePercent?: number }> = {};
  for (const row of data || []) {
    const price = Number(row.entry_price);
    if (!Number.isFinite(price)) continue;
    out[row.pair] = { price };
  }
  return out;
}
