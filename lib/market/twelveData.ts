import type { OHLC } from "@/lib/signal-engine/types";

export async function fetchTwelveDataCandles(
  pair: string,
  interval: string,
  outputsize: number
): Promise<OHLC[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new Error("Market data provider is not configured");

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(pair)}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}&format=JSON`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const json = await res.json();

  if (json.status === "error") {
    throw new Error(json.message || "Market data error");
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
