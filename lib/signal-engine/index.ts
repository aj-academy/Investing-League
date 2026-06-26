import { gradeAllowed, type MinGradeFilter } from "./permission";
import { sessionOk, isWeekendMarket } from "./session";
import type { ComputedSignal, JournalHistoryRow, OHLC, TradingMode } from "./types";
import { computeV9Signal } from "./v8/adapter";
import { applyV8HistoryAndMode, type ScanJournalRow } from "./v8/historyMode";
import { applyV8NewsBlock, isNewsBlocked } from "./v8/news";
import { rankV8Signals } from "./v8/rank";
import { applyV9Layers } from "./v9/classify";
import { buildV10ScanMeta } from "./v10/scanMeta";
import {
  applyV10Layers,
  filterByShowSignalsV10,
  isV10LiveDisplay,
  isV10PendingDisplay,
  shouldJournalV10Signal,
} from "./v10/validate";
import type { EntryMethod } from "./v10/types";

export * from "./types";
export * from "./v9/types";
export { applyV9Layers, filterByShowSignals, isV9LiveDisplay, shouldJournalV9Signal } from "./v9/classify";
export { buildV9ScanMeta } from "./v9/scanMeta";
export {
  applyV10Layers,
  applyV10Permission,
  rankV10Signals,
  filterByShowSignalsV10,
  isV10LiveDisplay,
  isV10PendingDisplay,
  isV10TradeTier,
  shouldJournalV10Signal,
  countByV10Permission,
} from "./v10/validate";
export { buildV10ScanMeta } from "./v10/scanMeta";
export type { EntryMethod, V10Permission } from "./v10/types";
export * from "./session";
export { gradeAllowed, type MinGradeFilter } from "./permission";
export { isNewsBlocked } from "./v8/news";

/** Single-pair V9 compute (batch finalize via finalizeScanSignals). */
export function computeSignal(
  ohlc: OHLC[],
  pair: string,
  tf: string,
  mode: TradingMode = "practice",
  _journalHistory: JournalHistoryRow[] = [],
  options?: { timeZone?: string; minGrade?: MinGradeFilter }
): ComputedSignal | null {
  const sig = computeV9Signal(ohlc, pair, tf, mode, options?.timeZone);
  if (!sig) return null;
  const minGrade = options?.minGrade ?? "A";
  if (!gradeAllowed(sig.grade, minGrade)) return null;
  return sig;
}

export interface FinalizeScanOptions {
  mode: TradingMode;
  journal: ScanJournalRow[];
  dailyLimit?: number;
  timeZone?: string;
  applyNews?: boolean;
}

/** V9 post-scan: history cooldown, daily limit, live selector, news block, sort. */
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
  const minGrade = options.minGrade ?? (options.showBSignals ? "B" : "A");

  return signals
    .filter((sig) => gradeAllowed(sig.grade, minGrade))
    .sort(rankV8Signals);
}

export type { ScanJournalRow, V8JournalRow } from "./v8/historyMode";
export { computeV9Signal } from "./v8/adapter";
