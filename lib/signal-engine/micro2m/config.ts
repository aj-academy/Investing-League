/** 2M Micro Direction Engine — separate from V9 LIVE. Do not use for V9 LIVE gates. */
export const MICRO_2M_CONFIG = {
  enabled: true,

  minTradeReadiness: 70,
  strongTradeReadiness: 75,
  watchReadiness: 60,

  minGrade: "B" as const,

  minBodyRatio: 12,
  strongBodyRatio: 22,

  maxSignalsToShow: 3,

  avoidPairs: [] as string[],
  cautionPairs: ["EUR/GBP"] as string[],

  blockIfNews: true,
  blockIfWeekend: true,
  blockIfDoji: true,
  blockIfCandleConflict: true,
  blockIfTrendExhausted: true,
  blockIfRepeatedSignal: true,

  useOneMinuteConfirmation: true,
  oneMinuteLookbackCandles: 30,

  expiryLabel: "2 minutes",

  maxRealTradesPerDay: 5,
  stopAfterLosses: 2,
  stopAfterConsecutiveLosses: 2,
} as const;

export type Micro2MConfig = typeof MICRO_2M_CONFIG;
