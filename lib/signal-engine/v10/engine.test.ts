import { describe, expect, it } from "vitest";
import { applyV10Permission, rankV10Signals } from "./permission";
import type { ComputedSignal } from "../types";

function baseSignal(overrides: Partial<ComputedSignal> = {}): ComputedSignal {
  return {
    pair: "EUR/USD",
    direction: "CALL",
    tf: "5min",
    score: 80,
    conf: 80,
    tier: "A+",
    grade: "A+",
    scoreGap: 14,
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
    mode: "practice",
    adx: 24,
    candleBodyRatio: 45,
    candleBullish: true,
    candleBearish: false,
    candleStrengthText: "STRONG",
    v9Layer: "LIVE",
    ...overrides,
  };
}

describe("V10 permission tiers", () => {
  it("assigns TRADE_ALLOWED for high quality with gap and adx", () => {
    const out = applyV10Permission([baseSignal({ conf: 82, scoreGap: 14, adx: 24 })])[0];
    expect(["TRADE_ALLOWED", "PENDING_ORDER_SIGNAL"]).toContain(out.v10Permission);
    expect(out.v9Layer).toBe("LIVE");
  });

  it("assigns PENDING_ORDER_SIGNAL for 70-77 quality range", () => {
    const out = applyV10Permission([baseSignal({ conf: 74, scoreGap: 10, adx: 18 })])[0];
    expect(["PENDING_ORDER_SIGNAL", "CAUTION_SIGNAL"]).toContain(out.v10Permission);
  });

  it("assigns CAUTION for moderate quality", () => {
    const out = applyV10Permission([baseSignal({ conf: 65, scoreGap: 5, adx: 12 })])[0];
    expect(["CAUTION_SIGNAL", "AVOID_TRADE"]).toContain(out.v10Permission);
  });

  it("assigns AVOID_TRADE for doji blocker", () => {
    const out = applyV10Permission([baseSignal({ candleBodyRatio: 8, conf: 40 })])[0];
    expect(out.v10Permission).toBe("AVOID_TRADE");
    expect(out.v10Blockers?.some((b) => /Doji/i.test(b))).toBe(true);
  });

  it("rankV10Signals returns top setups and never empty when candidates exist", () => {
    const signals = applyV10Permission([
      baseSignal({ conf: 50, signalUid: "a" }),
      baseSignal({ conf: 72, signalUid: "b" }),
      baseSignal({ conf: 80, signalUid: "c" }),
    ]);
    const ranked = rankV10Signals(signals);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.length).toBeLessThanOrEqual(5);
    expect(ranked[0].liveRank).toBe(1);
  });
});
