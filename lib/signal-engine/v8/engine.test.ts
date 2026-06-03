import { describe, expect, it } from "vitest";
import { gradeAllowed } from "../permission";
import { isWeekendMarket, sessionOk } from "../session";
import type { ComputedSignal } from "../types";
import { v8RawToComputed } from "./adapter";
import { computeV8Raw } from "./compute";
import { FIXTURE_AS_OF, WEEKEND_AS_OF, buildUptrendBars } from "./fixtures";
import { applyV8HistoryAndMode } from "./historyMode";
import { applyV8NewsBlock } from "./news";
import { rankV8Signals } from "./rank";

function baseSignal(overrides: Partial<ComputedSignal> = {}): ComputedSignal {
  return {
    pair: "EUR/USD",
    direction: "CALL",
    tf: "5min",
    score: 70,
    conf: 72,
    tier: "A",
    grade: "A",
    scoreGap: 8,
    weightedScore: 70,
    oppositeScore: 62,
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
    entryTime: "17:30:00",
    expTime: "17:35:00",
    entryAtIso: FIXTURE_AS_OF.toISOString(),
    expAtIso: new Date(FIXTURE_AS_OF.getTime() + 5 * 60_000).toISOString(),
    expMin: 5,
    maxEntryDrift: "0.00010",
    entryNote: "",
    riskNote: "",
    rsi: "55",
    stoch: "50",
    cci: "0",
    bb: "50%",
    macdH: "0",
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
    ohlc: [],
    signalUid: "test-uid",
    signalType: "FINAL TRADE",
    signalReason: "test",
    permission: "TRADE ALLOWED",
    tradeEligible: true,
    mode: "practice",
    adx: 20,
    candleBodyRatio: 40,
    candleBullish: true,
    candleBearish: false,
    candleStrengthText: "OK",
    ...overrides,
  };
}

describe("V8 session", () => {
  it("blocks any session filter on weekend market", () => {
    expect(isWeekendMarket(WEEKEND_AS_OF)).toBe(true);
    expect(sessionOk("any", WEEKEND_AS_OF)).toBe(false);
    expect(sessionOk("london", WEEKEND_AS_OF)).toBe(false);
  });

  it("allows scans on weekday liquid session", () => {
    expect(isWeekendMarket(FIXTURE_AS_OF)).toBe(false);
    expect(sessionOk("any", FIXTURE_AS_OF)).toBe(true);
    expect(sessionOk("london", FIXTURE_AS_OF)).toBe(true);
  });
});

describe("V8 grade filter", () => {
  it("matches HTML min grade rules", () => {
    expect(gradeAllowed("B", "B")).toBe(true);
    expect(gradeAllowed("A", "B")).toBe(true);
    expect(gradeAllowed("A+", "A")).toBe(true);
    expect(gradeAllowed("B", "A")).toBe(false);
    expect(gradeAllowed("A", "A+")).toBe(false);
  });
});

describe("V8 compute golden fixture", () => {
  it("produces stable CALL uptrend signal on fixed bars + asOf", () => {
    const raw = computeV8Raw(buildUptrendBars(), "EUR/USD", "5min", "Asia/Kolkata", FIXTURE_AS_OF);
    expect(raw).not.toBeNull();
    expect(raw!.direction).toBe("CALL");
    expect(raw!.gap).toBeGreaterThanOrEqual(6);
    expect(["A+", "A", "B", "C"]).toContain(raw!.grade);
    expect(["TRADE ALLOWED", "OBSERVE ONLY", "DO NOT TRADE"]).toContain(raw!.permission);
    expect(raw!.score).toBeGreaterThanOrEqual(62);

    const sig = v8RawToComputed(raw!, "practice");
    expect(sig.entryAtIso).toBeTruthy();
    expect(sig.signalUid.length).toBeGreaterThan(10);
  });
});

describe("V8 history and mode", () => {
  function todayJournalDate(timeZone = "Asia/Kolkata") {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const dd = parts.find((p) => p.type === "day")?.value ?? "01";
    const mm = parts.find((p) => p.type === "month")?.value ?? "01";
    const yyyy = parts.find((p) => p.type === "year")?.value ?? "1970";
    return `${dd}/${mm}/${yyyy}`;
  }

  it("downgrades to DAILY LIMIT when counted trades exceed limit", () => {
    const sig = baseSignal();
    const today = todayJournalDate();
    const journal = Array.from({ length: 5 }, (_, i) => ({
      date: today,
      signalTime: `12:0${i}:00`,
      type: "FINAL TRADE",
      counted: "YES" as const,
      pair: "GBP/USD",
      direction: "PUT",
      result: "Pending",
      entryTime: `12:0${i}:00`,
    }));
    const out = applyV8HistoryAndMode([sig], "practice", journal, {
      dailyLimit: 5,
      timeZone: "Asia/Kolkata",
    });
    expect(out[0].signalType).toBe("DAILY LIMIT");
    expect(out[0].permission).toBe("OBSERVE ONLY");
  });

  it("blocks REPEATED SIGNAL within cooldown window", () => {
    const entryIso = FIXTURE_AS_OF.toISOString();
    const sig = baseSignal({ entryAtIso: entryIso, entryTime: "17:30:00" });
    const journal = [
      {
        date: "05/01/2026",
        signalTime: "17:28:00",
        type: "FINAL TRADE",
        counted: "YES" as const,
        pair: "EUR/USD",
        direction: "CALL",
        result: "Pending",
        entryTime: "17:28:00",
      },
    ];
    const out = applyV8HistoryAndMode([sig], "practice", journal, {
      dailyLimit: 999,
      timeZone: "Asia/Kolkata",
    });
    expect(out[0].signalType).toBe("REPEATED SIGNAL");
    expect(out[0].permission).toBe("DO NOT TRADE");
  });

  it("live mode keeps only top TRADE ALLOWED setup", () => {
    const a = baseSignal({ pair: "EUR/USD", conf: 80, signalType: "STRONG FINAL" });
    const b = baseSignal({
      pair: "GBP/USD",
      conf: 70,
      signalType: "FINAL TRADE",
      entryAtIso: new Date(FIXTURE_AS_OF.getTime() + 60_000).toISOString(),
    });
    const out = applyV8HistoryAndMode([a, b], "live", [], { dailyLimit: 999 });
    const allowed = out.filter((s) => s.permission === "TRADE ALLOWED");
    expect(allowed).toHaveLength(1);
    expect(allowed[0].pair).toBe("EUR/USD");
  });
});

describe("V8 news block", () => {
  it("downgrades TRADE ALLOWED during news window", () => {
    const sig = baseSignal();
    const out = applyV8NewsBlock([sig], { name: "US data risk" });
    expect(out[0].signalType).toBe("NEWS CAUTION");
    expect(out[0].permission).toBe("OBSERVE ONLY");
  });
});

describe("V8 rank", () => {
  it("prefers STRONG FINAL over FINAL TRADE", () => {
    const strong = baseSignal({ signalType: "STRONG FINAL", conf: 75 });
    const final = baseSignal({ signalType: "FINAL TRADE", conf: 80 });
    expect(rankV8Signals(strong, final)).toBeLessThan(0);
  });
});
