import { gradeAllowed, type MinGradeFilter } from "./permission";
import { sessionOk } from "./session";
import type { ComputedSignal, JournalHistoryRow, OHLC, TradingMode } from "./types";
import { computeV8Signal } from "./v8/adapter";
import { applyV8HistoryAndMode, type V8JournalRow } from "./v8/historyMode";
import { applyV8NewsBlock, isNewsBlocked } from "./v8/news";
import { rankV8Signals } from "./v8/rank";

export * from "./types";
export * from "./session";
export { gradeAllowed, type MinGradeFilter } from "./permission";
export { isNewsBlocked } from "./v8/news";

/** Single-pair V8 compute (batch finalize via finalizeScanSignals). */
export function computeSignal(
  ohlc: OHLC[],
  pair: string,
  tf: string,
  mode: TradingMode = "practice",
  _journalHistory: JournalHistoryRow[] = [],
  options?: { timeZone?: string; minGrade?: MinGradeFilter }
): ComputedSignal | null {
  const sig = computeV8Signal(ohlc, pair, tf, mode, options?.timeZone);
  if (!sig) return null;
  const minGrade = options?.minGrade ?? "A";
  if (!gradeAllowed(sig.grade, minGrade)) return null;
  return sig;
}

export interface FinalizeScanOptions {
  mode: TradingMode;
  journal: V8JournalRow[];
  dailyLimit?: number;
  timeZone?: string;
  applyNews?: boolean;
}

/** V8 post-scan: history cooldown, daily limit, live selector, news block, sort. */
export function finalizeScanSignals(
  signals: ComputedSignal[],
  options: FinalizeScanOptions
): ComputedSignal[] {
  let out = applyV8HistoryAndMode(signals, options.mode, options.journal, {
    dailyLimit: options.dailyLimit,
    timeZone: options.timeZone,
  });
  if (options.applyNews !== false) {
    out = applyV8NewsBlock(out, isNewsBlocked());
  }
  return out.sort(rankV8Signals);
}

export interface ScanOptions {
  pairs: string[];
  timeframes: string[];
  mode: TradingMode;
  minGrade?: MinGradeFilter;
  showBSignals: boolean;
  sessionFilter: string;
}

export function filterSignals(
  signals: ComputedSignal[],
  options: ScanOptions
): ComputedSignal[] {
  if (!sessionOk(options.sessionFilter)) return [];

  const minGrade = options.minGrade ?? (options.showBSignals ? "B" : "A");

  return signals
    .filter((sig) => gradeAllowed(sig.grade, minGrade))
    .sort(rankV8Signals);
}

export type { V8JournalRow } from "./v8/historyMode";
