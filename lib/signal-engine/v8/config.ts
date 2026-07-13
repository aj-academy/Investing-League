/** V8 quality-first decision engine — fewer setups, higher win probability. */
export const V8_CONFIG = {
  /** Strong CALL/PUT separation required for trade permission. */
  scoreGap5: 8,
  scoreGap15: 5,
  atrMinNonJPY: 0.00022,
  atrMinJPY: 0.022,
  spreadNonJPY: 0.0001,
  spreadJPY: 0.03,
  /** Trend strength floors for FINAL TRADE. */
  adxMin5: 18,
  adxMin15: 20,
  /** High-confidence floors for trade permission. */
  finalConfMin: 72,
  finalScoreMin: 68,
  /** Grade A floors (trade permission needs A / A+). */
  gradeAConfMin: 70,
  gradeAScoreMin: 65,
  /** Prefer fresh entries — avoid re-trading the same setup quickly. */
  cooldown5: 12,
  cooldown15: 30,
  defaultDailyTradeLimit: 5,
  /** Live mode: only the strongest few setups across pairs. */
  maxLiveSignals: 2,
  /** Live pick must clear this confidence even after TRADE ALLOWED. */
  liveConfMin: 74,
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
