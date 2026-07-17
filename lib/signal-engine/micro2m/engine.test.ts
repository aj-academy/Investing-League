import { describe, expect, it } from "vitest";
import type { ComputedSignal } from "../types";
import { classify2MMicroSignal, get2MReadiness } from "./classify";
import { build2MMicroSignals } from "./build";
import { rank2MMicroSignals } from "./rank";
import type { Micro2MSignal } from "./types";

function baseSig(overrides: Partial<ComputedSignal> = {}): ComputedSignal {
  return {
    pair: "GBP/USD",
    direction: "PUT",
    tf: "5min",
    score: 70,
    conf: 73,
    tier: "B",
    grade: "B",
    scoreGap: 8,
    weightedScore: 70,
    oppositeScore: 62,
    category: { trend: 0, momentum: 0, volatility: 0, sr: 0, candle: 0 },
    marketStructure: {
      trend: "bearish",
      bullishBOS: false,
      bearishBOS: false,
      lastSwingHigh: null,
      lastSwingLow: null,
      structureScore: 0,
    },
    emaWmaBias: "Bearish",
    emaBullTrend: false,
    emaBearTrend: true,
    wmaBullTrend: false,
    wmaBearTrend: true,
    emaBullCross: false,
    emaBearCross: false,
    wmaBullCross: false,
    wmaBearCross: false,
    trendMomentumBull: false,
    trendMomentumBear: true,
    overExtendedBull: false,
    overExtendedBear: false,
    bigCandle: false,
    price: "1.25000",
    chgPct: "-0.1",
    entryTime: "20:55:00",
    expTime: "21:00:00",
    expMin: 5,
    maxEntryDrift: "0.00010",
    entryNote: "",
    riskNote: "",
    rsi: "45",
    stoch: "40",
    cci: "0",
    bb: "40%",
    macdH: "-0.1",
    atr: "0.0003",
    bullChecks: [],
    bearChecks: [],
    checks: [],
    pats: [],
    pivs: { R2: 0, R1: 0, P: 0, S1: 0, S2: 0 },
    volOk: true,
    sidewaysMarket: false,
    emaCompression: 0,
    reason: "test",
    ohlc: [
      { date: "t1", open: 1.251, high: 1.252, low: 1.249, close: 1.25 },
      { date: "t2", open: 1.251, high: 1.2515, low: 1.248, close: 1.249 },
    ],
    signalUid: "test-gbp-put",
    signalType: "WATCH ONLY",
    signalReason: "Observation",
    permission: "OBSERVE ONLY",
    tradeEligible: false,
    mode: "practice",
    adx: 18,
    candleBodyRatio: 35,
    candleBullish: false,
    candleBearish: true,
    candleStrengthText: "OK",
    v9Layer: "RADAR",
    v9Readiness: 73,
    ...overrides,
  };
}

describe("2M Micro classify", () => {
  it("GBP/USD PUT readiness 73% B aligned becomes 2M MICRO TRADE", () => {
    const out = classify2MMicroSignal(baseSig());
    expect(out.microPermission).toBe("2M_MICRO_TRADE");
    expect(out.microLabel).toBe("2M MICRO TRADE");
  });

  it("readiness 75%+ strong body becomes STRONG 2M MICRO TRADE", () => {
    const out = classify2MMicroSignal(
      baseSig({ v9Readiness: 76, candleBodyRatio: 28, conf: 76, grade: "A" }),
    );
    expect(out.microPermission).toBe("2M_STRONG_MICRO");
  });

  it("readiness 60–69 becomes 2M WATCH", () => {
    const out = classify2MMicroSignal(baseSig({ v9Readiness: 65, conf: 65 }));
    expect(out.microPermission).toBe("2M_WATCH");
  });

  it("readiness below 60 becomes 2M AVOID", () => {
    const out = classify2MMicroSignal(baseSig({ v9Readiness: 40, conf: 40 }));
    expect(out.microPermission).toBe("2M_AVOID");
  });

  it("candle conflict becomes 2M AVOID", () => {
    const out = classify2MMicroSignal(
      baseSig({ candleBullish: true, candleBearish: false, direction: "PUT" }),
    );
    expect(out.microPermission).toBe("2M_AVOID");
  });

  it("doji becomes 2M AVOID", () => {
    const out = classify2MMicroSignal(baseSig({ candleBodyRatio: 8 }));
    expect(out.microPermission).toBe("2M_AVOID");
  });

  it("1m conflict downgrades MICRO TRADE to WATCH", () => {
    const oneMin = [
      { date: "a", open: 1.25, high: 1.251, low: 1.249, close: 1.2505 },
      { date: "b", open: 1.2505, high: 1.252, low: 1.2504, close: 1.2518 }, // bullish vs PUT
    ];
    const out = classify2MMicroSignal(baseSig(), oneMin);
    expect(out.microPermission).toBe("2M_WATCH");
  });
});

describe("2M Micro rank/build", () => {
  it("returns max 3 and marks best", () => {
    const signals = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"].map((pair, i) =>
      baseSig({
        pair,
        signalUid: `uid-${i}`,
        v9Readiness: 80 - i,
        candleBodyRatio: 30,
        grade: "A",
        conf: 80 - i,
      }),
    );
    const out = build2MMicroSignals(signals);
    expect(out.length).toBeLessThanOrEqual(3);
    expect(out[0].isBest).toBe(true);
  });

  it("get2MReadiness falls back when missing", () => {
    const r = get2MReadiness(baseSig({ v9Readiness: undefined }));
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThanOrEqual(100);
  });

  it("rank prefers strong over watch", () => {
    const a: Micro2MSignal = {
      id: "1",
      pair: "EUR/USD",
      direction: "CALL",
      sourceTf: "5min",
      grade: "A",
      conf: 70,
      score: 70,
      scoreGap: 8,
      microReadiness: 80,
      microPermission: "2M_STRONG_MICRO",
      microLabel: "STRONG 2M MICRO TRADE",
      microReason: "",
      microAction: "",
      candleAligned: true,
      candleBodyRatio: 30,
      isDoji: false,
      oneMinuteStatus: "SUPPORTS",
      oneMinuteNote: "",
      expiryLabel: "2 minutes",
      strategyType: "2M_MICRO",
      entryMethod: "manual_2m",
      isBest: false,
      warnings: [],
    };
    const b = { ...a, id: "2", pair: "GBP/USD", microPermission: "2M_WATCH" as const, microLabel: "2M WATCH" as const, microReadiness: 90 };
    const ranked = rank2MMicroSignals([b, a]);
    expect(ranked[0].pair).toBe("EUR/USD");
  });
});
