import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getMarketCandles } from "@/lib/market/cachedCandles";
import { PAIRS } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const pair = String(body.pair || "");
    const interval = String(body.interval || "");
    const outputsize = Number(body.outputsize || 150);

    if (!PAIRS.includes(pair as (typeof PAIRS)[number])) {
      return NextResponse.json({ error: "Invalid pair" }, { status: 400 });
    }
    if (!["5min", "15min"].includes(interval)) {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }
    if (!Number.isFinite(outputsize) || outputsize < 2 || outputsize > 500) {
      return NextResponse.json({ error: "Invalid output size" }, { status: 400 });
    }

    const candles = await getMarketCandles(pair, interval, outputsize);
    return NextResponse.json({ candles });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Market data unavailable";
    const status = /api limit|api credits/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
