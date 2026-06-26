/** V10 permission thresholds — visibility + honest trade labels (24/5 scans). */
export const V10_CONFIG = {
  tradeAllowedQuality: 78,
  pendingSignalQuality: 70,
  cautionSignalQuality: 62,

  tradeGap5: 12,
  tradeGap15: 8,

  pendingGap5: 9,
  pendingGap15: 6,

  minAdxTrade: 20,
  minAdxPending: 16,

  candleBodyTrade5: 35,
  candleBodyTrade15: 30,

  candleBodyPending5: 25,
  candleBodyPending15: 22,

  bbCallExtreme: 0.97,
  bbPutExtreme: 0.03,
  bbCallBlock: 0.95,
  bbPutBlock: 0.05,

  maxSignalsToShow: 5,

  /** RSI bands for momentum confirmation (Step 5). */
  rsiCallMin: 50,
  rsiCallMax: 72,
  rsiCallHardBlock: 78,
  rsiPutMax: 50,
  rsiPutMin: 28,
  rsiPutHardBlock: 22,

  stochCallBlock: 85,
  stochPutBlock: 15,

  macdFlatNonJpy: 0.000001,
  macdFlatJpy: 0.0001,

  practiceMinQuality: 65,
  radarMinQuality: 50,
} as const;
