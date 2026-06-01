import type { OHLC } from "@/lib/signal-engine/types";

export async function fetchTwelveDataCandles(
  pair: string,
  interval: string,
  outputsize: number
): Promise<OHLC[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new Error("Market data provider is not configured");

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(pair)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}&format=JSON`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (json.status === "error") {
    const msg = String(json.message || "Market data error");
    if (json.code === 429 || /run out of api credits/i.test(msg)) {
      throw new Error(
        "Twelve Data daily API limit reached. Wait until tomorrow or upgrade your plan at twelvedata.com/pricing."
      );
    }
    throw new Error(msg);
  }
  if (!json.values?.length) {
    throw new Error("No candle data returned");
  }

  return json.values
    .reverse()
    .map((v: { datetime: string; open: string; high: string; low: string; close: string }) => ({
      date: v.datetime,
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
    }));
}

export async function fetchTwelveDataPrice(pair: string): Promise<{ price: number; datetime?: string }> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new Error("Market data provider is not configured");

  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(pair)}&apikey=${apiKey}&format=JSON`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (json.status === "error") {
    const msg = String(json.message || "Market data error");
    if (json.code === 429 || /run out of api credits/i.test(msg)) {
      throw new Error(
        "Twelve Data daily API limit reached. Wait until tomorrow or upgrade your plan at twelvedata.com/pricing."
      );
    }
    throw new Error(msg);
  }

  const price = parseFloat(json.price);
  if (!Number.isFinite(price)) throw new Error("No price returned");
  return { price, datetime: json.datetime };
}
