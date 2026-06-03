import type { ComputedSignal } from "../types";

/** V8 HTML isNewsBlocked — conservative permission during news windows. */
export function isNewsBlocked(): { name: string } | null {
  const d = new Date();
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const mins = h * 60 + m;
  const windows = [
    { name: "US data risk", start: 13 * 60 + 15, end: 14 * 60 + 45 },
    { name: "Fed risk", start: 18 * 60 + 45, end: 19 * 60 + 30 },
    { name: "London open risk", start: 7 * 60 + 50, end: 8 * 60 + 10 },
  ];
  return windows.find((w) => mins >= w.start && mins <= w.end) || null;
}

export function applyV8NewsBlock(
  signals: ComputedSignal[],
  news: { name: string } | null
): ComputedSignal[] {
  if (!news) return signals;
  for (const s of signals) {
    if (s.permission === "TRADE ALLOWED") {
      s.permission = "OBSERVE ONLY";
      s.signalType = "NEWS CAUTION";
      s.signalReason = `News-risk window active: ${news.name}. Observation only.`;
      s.tradeEligible = false;
    }
  }
  return signals;
}
