import { classifyV4, enrichWithV4Metrics } from "./classification";
import { applyLiveSelector } from "./liveSelector";
import { buildSignalUid, computeBaseSignal } from "./scoring";
import { sessionOk } from "./session";
import type { ComputedSignal, JournalHistoryRow, OHLC, TradingMode } from "./types";

export * from "./types";
export * from "./session";
export { rankSignal, applyLiveSelector, isEligible } from "./liveSelector";

export function computeSignal(
  ohlc: OHLC[],
  pair: string,
  tf: string,
  mode: TradingMode = "practice",
  journalHistory: JournalHistoryRow[] = []
): ComputedSignal | null {
  const base = computeBaseSignal(ohlc, pair, tf);
  if (!base) return null;

  const sig = enrichWithV4Metrics(
    {
      ...base,
      signalUid: "",
      signalType: "WATCH ONLY",
      signalReason: "",
      tradeEligible: false,
      mode,
      adx: 0,
      candleBodyRatio: 0,
      candleBullish: false,
      candleBearish: false,
      candleStrengthText: "OK",
    },
    ohlc
  );

  classifyV4(sig, mode, journalHistory);
  sig.signalUid = buildSignalUid(sig.pair, sig.tf, sig.direction, sig.entryTime, sig.expTime);
  return sig;
}

export interface ScanOptions {
  pairs: string[];
  timeframes: string[];
  mode: TradingMode;
  minScore: number;
  showBSignals: boolean;
  sessionFilter: string;
}

export function filterSignals(
  signals: ComputedSignal[],
  options: ScanOptions
): ComputedSignal[] {
  if (!sessionOk(options.sessionFilter)) return [];

  let filtered = signals.filter((sig) => {
    const gradeAllowed =
      sig.grade === "A+" ||
      sig.grade === "A" ||
      (options.showBSignals && sig.grade === "B");
    return gradeAllowed && sig.score >= options.minScore;
  });

  if (options.mode === "live") {
    filtered = applyLiveSelector(filtered);
  }

  filtered.sort((a, b) => {
    const ar = a.tradeEligible ? 1 : 0;
    const br = b.tradeEligible ? 1 : 0;
    if (ar !== br) return br - ar;
    return (b.liveRank || 0) - (a.liveRank || 0) || b.conf - a.conf;
  });

  return filtered;
}
