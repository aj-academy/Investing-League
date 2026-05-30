import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "EUR/GBP",
] as const;

export const DISCLAIMER =
  "This platform is for educational analysis, signal testing, and trade journaling only. It does not guarantee profit and does not provide financial advice. Trading involves risk. Users are responsible for their own trading decisions.";

export function isJpyPair(pair: string) {
  return pair.includes("JPY");
}

export function decimalsForPair(pair: string) {
  return isJpyPair(pair) ? 3 : 5;
}

export function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
