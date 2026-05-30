import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getMarketCandles } from "@/lib/market/cachedCandles";
import { PAIRS, isJpyPair } from "@/lib/utils";
import { NextResponse } from "next/server";

export type TickerItem = {
  pair: string;
  price: string;
  chg: string;
  up: boolean;
};

/** One request returns all ticker rows (cached) instead of 8 parallel candle calls. */
export async function GET() {
  try {
    const { error } = await requireApiAuth();
    if (error) return error;

    const items: TickerItem[] = [];

    for (const pair of PAIRS) {
      try {
        const candles = await getMarketCandles(pair, "5min", 5);
        if (candles.length < 2) continue;
        const last = candles[candles.length - 1];
        const prev = candles[candles.length - 2];
        const chg = ((last.close - prev.close) / prev.close) * 100;
        const up = chg >= 0;
        const dp = isJpyPair(pair) ? 3 : 5;
        items.push({
          pair,
          price: last.close.toFixed(dp),
          chg: `${up ? "▲" : "▼"}${Math.abs(chg).toFixed(3)}%`,
          up,
        });
      } catch {
        /* skip pair on failure */
      }
    }

    if (!items.length) {
      return NextResponse.json(
        { error: "No market data available. Check Twelve Data API key and daily credits." },
        { status: 503 }
      );
    }

    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Market data unavailable";
    const status = /api limit|api credits/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
