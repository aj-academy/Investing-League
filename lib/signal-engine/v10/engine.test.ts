import { describe, expect, it } from "vitest";
import { applyV10Layer } from "./validate";
import type { ComputedSignal } from "../types";

function baseSignal(overrides: Partial<ComputedSignal> = {}): ComputedSignal {
  return {
    pair: "EUR/USD",
    direction: "CALL",
    tf: "5min",
    score: 80,
    conf: 78,
    tier: "A+",
    grade: "A+",
    scoreGap: 16,
    weightedScore: 80,
    oppositeScore: 40,
    category: { trend: 0, momentum: 0, volatility: 0, sr: 0, candle: 0 },
    marketStructure: {
      trend: "bullish",
      bullishBOS: false,
      bearishBOS: false,
      lastSwingHigh: null,
      lastSwingLow: null,
      structureScore: 0,
    },
    emaWmaBias: "Bullish",
    emaBullTrend: true,
    emaBearTrend: false,
    wmaBullTrend: true,
    wmaBearTrend: false,
    emaBullCross: false,
    emaBearCross: false,
    wmaBullCross: false,
    wmaBearCross: false,
    trendMomentumBull: true,
    trendMomentumBear: false,
    overExtendedBull: false,
    overExtendedBear: false,
    bigCandle: false,
    price: "1.08500",
    chgPct: "0.01",
    entryTime: "12:00:00",
    expTime: "12:05:00",
    expMin: 5,
    maxEntryDrift: "0.00010",
    entryNote: "test",
    riskNote: "",
    rsi: "58",
    stoch: "45",
    cci: "10",
    bb: "55%",
    macdH: "0.0002",
    atr: "0.0008",
    bullChecks: [],
    bearChecks: [],
    checks: [],
    pats: [],
    pivs: { R2: 0, R1: 0, P: 0, S1: 0, S2: 0 },
    volOk: true,
    sidewaysMarket: false,
    emaCompression: 0,
    reason: "test",
    ohlc: [],
    signalUid: "test_uid",
    signalType: "STRONG FINAL",
    signalReason: "test",
    permission: "TRADE ALLOWED",
    tradeEligible: true,
    mode: "live",
    adx: 24,
    candleBodyRatio: 45,
    candleBullish: true,
    candleBearish: false,
    candleStrengthText: "STRONG",
    v9Layer: "PRACTICE",
    ...overrides,
  };
}

describe("V10 layer downgrade", () => {
  it("never upgrades non-LIVE V9 to LIVE", () => {
    const out = applyV10Layer(baseSignal({ v9Layer: "PRACTICE" }), {
      entryMethod: "pending_order",
      htfCandlesByPair: new Map(),
    });
    expect(out.v10Layer).not.toBe("LIVE");
    expect(out.v10Layer).toBe("PRACTICE");
  });

  it("downgrades V9 LIVE with weak gap", () => {
    const out = applyV10Layer(
      baseSignal({ v9Layer: "LIVE", scoreGap: 4, ohlc: [] }),
      { entryMethod: "manual", htfCandlesByPair: new Map() },
    );
    expect(out.v10Layer).not.toBe("LIVE");
  });
});
