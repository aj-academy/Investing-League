import { formatAppDateSlash } from "@/lib/datetime";
import type { ComputedSignal, TradingMode } from "../types";
import { ELIGIBLE_TYPES, USD_LINKED, V8_CONFIG } from "./config";
import { rankV8Signals } from "./rank";

export interface V8JournalRow {
  date: string;
  signalTime: string;
  type: string;
  permission?: string;
  counted?: string;
  pair: string;
  direction: string;
  result?: string | null;
  entryTime?: string | null;
}

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    if (dateStr.includes("/")) {
      const [dd, mm, yyyy] = dateStr.split("/").map(Number);
      const [hh, mi, ss] = timeStr.split(":").map(Number);
      return new Date(Date.UTC(yyyy, mm - 1, dd, hh - 5, mi - 30, ss || 0));
    }
    const d = new Date(dateStr);
    if (timeStr) {
      const [hh, mi, ss] = timeStr.split(":").map(Number);
      d.setHours(hh || 0, mi || 0, ss || 0, 0);
    }
    return d;
  } catch {
    return null;
  }
}

function journalEntryMs(r: V8JournalRow): number | null {
  return parseDateTime(r.date, r.entryTime || r.signalTime)?.getTime() ?? null;
}

function signalEntryMs(sig: ComputedSignal): number | null {
  if (sig.entryAtIso) return new Date(sig.entryAtIso).getTime();
  return parseDateTime("", sig.entryTime)?.getTime() ?? null;
}

function isRecentEntry(journalRow: V8JournalRow, signal: ComputedSignal, mins: number): boolean {
  const sigMs = signalEntryMs(signal);
  const jMs = journalEntryMs(journalRow);
  if (sigMs == null || jMs == null) return false;
  return Math.abs(sigMs - jMs) / 60_000 <= mins;
}

function journalDateToday(timeZone: string): string {
  return formatAppDateSlash(new Date(), timeZone);
}

/** V8 HTML applyHistoryAndMode — journal cooldown, daily limit, live selector. */
export function applyV8HistoryAndMode(
  signals: ComputedSignal[],
  mode: TradingMode,
  journal: V8JournalRow[],
  options?: { dailyLimit?: number; timeZone?: string }
): ComputedSignal[] {
  const dailyLimit = options?.dailyLimit ?? V8_CONFIG.defaultDailyTradeLimit;
  const today = journalDateToday(options?.timeZone || "Asia/Kolkata");

  const countedToday = journal.filter(
    (r) =>
      r.date === today &&
      r.counted === "YES" &&
      ["Win", "Loss", "Refund", "Pending"].includes(String(r.result || ""))
  ).length;

  for (const s of signals) {
    if (s.permission === "TRADE ALLOWED") {
      const cd = s.tf === "5min" ? V8_CONFIG.cooldown5 : V8_CONFIG.cooldown15;
      const recent = journal.find(
        (r) =>
          r.pair === s.pair &&
          r.direction === s.direction &&
          ELIGIBLE_TYPES.includes(r.type as (typeof ELIGIBLE_TYPES)[number]) &&
          isRecentEntry(r, s, cd)
      );
      if (recent) {
        s.permission = "DO NOT TRADE";
        s.signalType = "REPEATED SIGNAL";
        s.signalReason =
          "A Final/Strong signal already appeared recently. Avoid repeated re-entry.";
        s.tradeEligible = false;
      } else if (countedToday >= dailyLimit) {
        s.permission = "OBSERVE ONLY";
        s.signalType = "DAILY LIMIT";
        s.signalReason = "Daily trade limit reached. Observation only.";
        s.tradeEligible = false;
      }
    }
  }

  if (mode === "live") {
    const allowed = signals.filter((s) => s.permission === "TRADE ALLOWED");
    allowed.sort(rankV8Signals);
    if (allowed.length) {
      const best = allowed[0];
      for (const s of signals) {
        if (s === best) {
          s.signalReason =
            "LIVE MODE SELECTED: best ranked signal in this scan. " + (s.signalReason || "");
          continue;
        }
        if (s.permission === "TRADE ALLOWED") {
          s.permission = "OBSERVE ONLY";
          s.signalType =
            USD_LINKED.has(s.pair) && USD_LINKED.has(best.pair)
              ? "CORRELATION RISK"
              : "WATCH ONLY";
          s.signalReason =
            "LIVE MODE: not the top-ranked setup in this scan. Observation only.";
          s.tradeEligible = false;
        }
      }
    }
  }

  return [...signals].sort(rankV8Signals);
}
