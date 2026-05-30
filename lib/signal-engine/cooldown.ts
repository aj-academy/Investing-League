import type { JournalHistoryRow } from "./types";

export const V4_POLICY = {
  cooldown5: 10,
  cooldown15: 30,
  exhaustAfterFinalTrades: 2,
  exhaustWindow5: 20,
  exhaustWindow15: 60,
};

export function isEligibleType(type?: string) {
  return type === "FINAL TRADE" || type === "STRONG FINAL";
}

export function minutesFromTime(t?: string | null) {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minuteDiff(a?: string, b?: string) {
  const x = minutesFromTime(a);
  const y = minutesFromTime(b);
  if (x === null || y === null) return 9999;
  let d = Math.abs(y - x);
  if (d > 720) d = 1440 - d;
  return d;
}

export function historyFinals(
  sig: { pair: string; tf: string; direction: string; entryTime: string },
  rows: JournalHistoryRow[]
) {
  const filtered = rows.filter(
    (r) =>
      r.pair === sig.pair &&
      (r.timeframe === sig.tf || r.timeframe === sig.tf) &&
      r.direction === sig.direction &&
      isEligibleType(r.signalType)
  );
  const cd = sig.tf === "15min" ? V4_POLICY.cooldown15 : V4_POLICY.cooldown5;
  const win = sig.tf === "15min" ? V4_POLICY.exhaustWindow15 : V4_POLICY.exhaustWindow5;
  return {
    recentFinal: filtered.filter(
      (r) => minuteDiff(r.signal_entry_time || r.entry_time, sig.entryTime) <= cd
    ),
    clusterFinal: filtered.filter(
      (r) => minuteDiff(r.signal_entry_time || r.entry_time, sig.entryTime) <= win
    ),
  };
}
