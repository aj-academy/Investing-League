import type { OHLC } from "@/lib/signal-engine/types";
import { getCachedCandles, setCachedCandles } from "@/lib/market/candleCache";
import { fetchTwelveDataCandles } from "@/lib/market/twelveData";
import { createAdminClient } from "@/lib/supabase/admin";

const DB_CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(pair: string, interval: string, outputsize: number) {
  return { pair, interval, outputsize };
}

async function readDbCache(pair: string, interval: string, outputsize: number): Promise<OHLC[] | null> {
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
    if (age > DB_CACHE_TTL_MS) return null;
    return data.payload as OHLC[];
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

/** Shared cache (memory + Supabase) to limit Twelve Data credit usage. */
export async function getMarketCandles(
  pair: string,
  interval: string,
  outputsize: number
): Promise<OHLC[]> {
  const mem = getCachedCandles(pair, interval, outputsize);
  if (mem) return mem;

  const db = await readDbCache(pair, interval, outputsize);
  if (db) {
    setCachedCandles(pair, interval, outputsize, db);
    return db;
  }

  const candles = await fetchTwelveDataCandles(pair, interval, outputsize);
  setCachedCandles(pair, interval, outputsize, candles);
  await writeDbCache(pair, interval, outputsize, candles);
  return candles;
}
