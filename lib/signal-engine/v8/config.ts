/** V8 clean decision engine constants (from universal_v8 HTML). */
export const V8_CONFIG = {
  scoreGap5: 6,
  scoreGap15: 4,
  atrMinNonJPY: 0.0002,
  atrMinJPY: 0.02,
  spreadNonJPY: 0.0001,
  spreadJPY: 0.03,
  cooldown5: 10,
  cooldown15: 30,
  defaultDailyTradeLimit: 5,
} as const;

export const USD_LINKED = new Set([
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
]);

export const ELIGIBLE_TYPES = ["FINAL TRADE", "STRONG FINAL"] as const;
