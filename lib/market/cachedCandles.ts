import type { OHLC } from "@/lib/signal-engine/types";
import { getCachedCandles, setCachedCandles } from "@/lib/market/candleCache";
import { fetchTwelveDataCandles } from "@/lib/market/twelveData";
import { createAdminClient } from "@/lib/supabase/admin";

export type CandleCacheResult = {
  candles: OHLC[];
  source: "cache" | "provider";
  providerCall: boolean;
  cacheHit: boolean;
  cachedAt?: string;
  expiresAt?: string;
};

function candleTtlMs(interval: string): number {
  if (interval === "15min") return 180_000;
  return 75_000;
}

async function readDbCache(
  pair: string,
  interval: string,
  outputsize: number
): Promise<{ candles: OHLC[]; fetchedAt: string } | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("market_cache")
      .select("payload, fetched_at")
      .eq("pair", pair)
      .eq("interval", interval)
      .eq("outputsize", outputsize)
      .maybeSingle();

    if (!data?.payload || !data.fetched_at) return null;
    const age = Date.now() - new Date(data.fetched_at).getTime();
    if (age > candleTtlMs(interval)) return null;
    return { candles: data.payload as OHLC[], fetchedAt: data.fetched_at };
  } catch {
    return null;
  }
}

async function writeDbCache(pair: string, interval: string, outputsize: number, candles: OHLC[]) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const admin = createAdminClient();
    await admin.from("market_cache").upsert(
      {
        pair,
        interval,
        outputsize,
        payload: candles,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "pair,interval,outputsize" }
    );
  } catch {
    /* non-fatal */
  }
}

/** Shared cache (memory + Supabase). Returns usage metadata for billing logs. */
export async function getCandlesCached(
  pair: string,
  interval: string,
  outputsize: number,
  options?: { allowProvider?: boolean }
): Promise<CandleCacheResult> {
  const allowProvider = options?.allowProvider !== false;
  const ttl = candleTtlMs(interval);
  const now = Date.now();

  const mem = getCachedCandles(pair, interval, outputsize, ttl);
  if (mem) {
    return {
      candles: mem,
      source: "cache",
      providerCall: false,
      cacheHit: true,
      cachedAt: new Date(now - 1000).toISOString(),
      expiresAt: new Date(now + ttl).toISOString(),
    };
  }

  const db = await readDbCache(pair, interval, outputsize);
  if (db) {
    setCachedCandles(pair, interval, outputsize, db.candles, ttl);
    const fetched = new Date(db.fetchedAt).getTime();
    return {
      candles: db.candles,
      source: "cache",
      providerCall: false,
      cacheHit: true,
      cachedAt: db.fetchedAt,
      expiresAt: new Date(fetched + ttl).toISOString(),
    };
  }

  if (!allowProvider) {
    throw new Error("No cached candle data available for this pair.");
  }

  const candles = await fetchTwelveDataCandles(pair, interval, outputsize);
  const cachedAt = new Date().toISOString();
  setCachedCandles(pair, interval, outputsize, candles, ttl);
  await writeDbCache(pair, interval, outputsize, candles);
  return {
    candles,
    source: "provider",
    providerCall: true,
    cacheHit: false,
    cachedAt,
    expiresAt: new Date(now + ttl).toISOString(),
  };
}

/** @deprecated Use getCandlesCached */
export async function getMarketCandles(
  pair: string,
  interval: string,
  outputsize: number
): Promise<OHLC[]> {
  const result = await getCandlesCached(pair, interval, outputsize);
  return result.candles;
}
