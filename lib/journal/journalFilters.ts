import { DEFAULT_TIME_ZONE } from "@/lib/datetime";
import { rowPermission } from "@/lib/journal/journalDisplay";
import type { TradePermission } from "@/lib/signal-engine/permission";
import { PAIRS } from "@/lib/utils";

export type JournalPermissionFilter = "" | TradePermission;

export type JournalFilterState = {
  from: string;
  to: string;
  pair: string;
  permission: JournalPermissionFilter;
  result: string;
};

export const DEFAULT_JOURNAL_FILTERS: JournalFilterState = {
  from: "",
  to: "",
  pair: "",
  permission: "TRADE ALLOWED",
  result: "",
};

export const JOURNAL_PERMISSION_OPTIONS: { value: JournalPermissionFilter; label: string }[] = [
  { value: "", label: "All permissions" },
  { value: "TRADE ALLOWED", label: "Trade allowed" },
  { value: "OBSERVE ONLY", label: "Observe only" },
  { value: "DO NOT TRADE", label: "Do not trade" },
];

export const JOURNAL_RESULT_OPTIONS = [
  { value: "", label: "All results" },
  { value: "Pending", label: "Pending" },
  { value: "Win", label: "Win" },
  { value: "Loss", label: "Loss" },
  { value: "Refund", label: "Refund" },
  { value: "Watch", label: "Watch" },
];

type FilterableJournalRow = {
  created_at: string;
  pair: string;
  signal_type?: string | null;
  trade_eligible?: boolean | null;
  result: string;
};

export function journalRowLocalDate(
  iso: string,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${d}`;
}

export function rowMatchesJournalFilters<T extends FilterableJournalRow>(
  row: T,
  filters: JournalFilterState,
  timeZone?: string,
): boolean {
  if (filters.from) {
    const day = journalRowLocalDate(row.created_at, timeZone);
    if (!day || day < filters.from) return false;
  }
  if (filters.to) {
    const day = journalRowLocalDate(row.created_at, timeZone);
    if (!day || day > filters.to) return false;
  }
  if (filters.pair && row.pair !== filters.pair) return false;
  if (filters.result && row.result !== filters.result) return false;
  if (filters.permission) {
    const perm = rowPermission(row.signal_type, row.trade_eligible);
    if (perm !== filters.permission) return false;
  }
  return true;
}

export function filterJournalRows<T extends FilterableJournalRow>(
  rows: T[],
  filters: JournalFilterState,
  timeZone?: string,
): T[] {
  return rows.filter((row) => rowMatchesJournalFilters(row, filters, timeZone));
}

export function pairsForJournalFilter(rows: { pair: string }[]): string[] {
  const fromRows = new Set(rows.map((r) => r.pair).filter(Boolean));
  const ordered = PAIRS.filter((p) => fromRows.has(p));
  const known = PAIRS as readonly string[];
  const extra = [...fromRows].filter((p) => !known.includes(p)).sort();
  return [...ordered, ...extra];
}

export function todayDateInputValue(timeZone: string = DEFAULT_TIME_ZONE): string {
  return journalRowLocalDate(new Date().toISOString(), timeZone);
}
