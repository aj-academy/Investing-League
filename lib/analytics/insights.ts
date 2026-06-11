import type { buildAnalyticsSummary } from "./summary";
import type { JournalRow } from "./summary";
import { journalPermission } from "@/lib/signal-engine/permission";

export type HealthStatus = "GOOD" | "CAUTION" | "HIGH RISK";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export const SIGNAL_TYPE_BUCKETS = [
  "TRADE ALLOWED",
  "STRONG FINAL",
  "FINAL TRADE",
  "WATCH ONLY",
  "LATE ENTRY",
  "REPEATED SIGNAL",
  "TREND EXHAUSTED",
  "DO NOT TRADE",
] as const;

export const LOSS_REASON_BUCKETS = [
  "Late Entry",
  "B Grade",
  "Low Confidence",
  "Repeated Signal",
  "Trend Exhausted",
  "Entry Drift",
  "News / Session Risk",
  "Unknown",
] as const;

type Summary = ReturnType<typeof buildAnalyticsSummary>;

export function winRateFromAgg(item: { wins: number; losses: number }) {
  const decided = item.wins + item.losses;
  return decided ? Math.round((item.wins / decided) * 100) : 0;
}

export function normalizeLossReason(reason: string | null | undefined): string {
  const r = (reason || "").toLowerCase();
  if (!r) return "Unknown";
  if (r.includes("late")) return "Late Entry";
  if (r.includes("b grade") || r === "b") return "B Grade";
  if (r.includes("confidence")) return "Low Confidence";
  if (r.includes("repeated")) return "Repeated Signal";
  if (r.includes("exhaust")) return "Trend Exhausted";
  if (r.includes("drift") || r.includes("entry")) return "Entry Drift";
  if (r.includes("news") || r.includes("session")) return "News / Session Risk";
  return "Unknown";
}

export function deriveHealthStatus(
  finalTradeWinRate: number,
  completedTrades: number
): HealthStatus {
  if (completedTrades < 20 || finalTradeWinRate < 55) return "HIGH RISK";
  if (finalTradeWinRate >= 62 && completedTrades >= 30) return "GOOD";
  if (finalTradeWinRate >= 55 && completedTrades >= 20) return "CAUTION";
  return "HIGH RISK";
}

export function deriveRiskLevel(
  summary: Summary,
  finalTradeWinRate: number
): { level: RiskLevel; reason: string } {
  const pendingHigh = summary.pending > summary.completedTrades * 2;
  const invalidHigh = summary.invalidEntries >= 3;

  if (
    finalTradeWinRate < 50 ||
    pendingHigh ||
    invalidHigh ||
    summary.completedTrades < 10
  ) {
    return {
      level: "HIGH",
      reason:
        finalTradeWinRate < 50
          ? "Verified win rate is below 50%."
          : pendingHigh
            ? "Too many unverified pending signals vs completed results."
            : invalidHigh
              ? "Invalid entries are elevated — check quote timing."
              : "Not enough completed trades for stable risk assessment.",
    };
  }

  if (finalTradeWinRate > 62 && summary.completedTrades >= 30) {
    return {
      level: "LOW",
      reason: "Strong verified win rate with sufficient sample size.",
    };
  }

  return {
    level: "MEDIUM",
    reason: "Performance is in the mid zone — tighten filters and verify more trades.",
  };
}

export function computeBotQualityScore(summary: Summary): number {
  let score = summary.finalTradeWinRate;
  if (summary.completedTrades >= 30) score += 10;
  if (summary.completedTrades < 20) score -= 10;
  if (summary.pending > summary.completedTrades * 3) score -= 10;
  if (summary.invalidEntries > 0) score -= 10;
  if (summary.refunds > summary.completedTrades * 0.15) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildHealthNarrative(
  status: HealthStatus,
  finalTradeWinRate: number,
  completedTrades: number,
  bestPair: string
): { mainWarning: string; recommendedAction: string } {
  if (completedTrades < 20) {
    return {
      mainWarning: "Sample size is still small — analytics need more verified results.",
      recommendedAction:
        "Log Win/Loss/Refund outcomes for at least 20 trades before relying on win rate.",
    };
  }

  if (status === "GOOD") {
    return {
      mainWarning: `Verified Final Trade WR is ${finalTradeWinRate}% with ${completedTrades} verified results.`,
      recommendedAction: `Stay disciplined on Trade-Eligible signals. ${bestPair !== "—" ? `Continue focusing on ${bestPair}.` : "Keep journaling every outcome."}`,
    };
  }

  if (status === "CAUTION") {
    return {
      mainWarning: `Final Trade WR is ${finalTradeWinRate}%. This is near breakeven zone.`,
      recommendedAction:
        "Focus only on Trade-Eligible signals and avoid Late Entry setups until WR improves.",
    };
  }

  return {
    mainWarning: `Final Trade WR is ${finalTradeWinRate}% or sample is thin (${completedTrades} verified).`,
    recommendedAction:
      "Reduce trade frequency. Test only Strong Final / Final Trade signals and complete journal entries.",
  };
}

export function buildRecommendations(
  summary: Summary,
  rows: JournalRow[],
  permissionCounts: { tradeAllowed: number; observe: number; blocked: number }
): string[] {
  const tips: string[] = [];
  const lateEntryCount = rows.filter((r) => r.signal_type === "LATE ENTRY").length;
  const lateLosses = Object.entries(summary.lossReasons).filter(([k]) =>
    k.toLowerCase().includes("late")
  );

  if (summary.finalTradeWinRate < 55) {
    tips.push("Reduce trade frequency and only test Strong Final signals.");
  }
  if (summary.pending > summary.completedTrades) {
    tips.push("Complete more journal entries before trusting analytics.");
  }
  if (summary.bestPair && summary.bestPair !== "—") {
    tips.push(`Focus testing on ${summary.bestPair} — your best-performing pair so far.`);
  }
  if (summary.invalidEntries > 0) {
    tips.push("Improve platform entry timing and verify opening/closing quotes for every trade.");
  }
  if (lateEntryCount > 0 || lateLosses.length > 0) {
    tips.push("Avoid chasing candles after movement is already extended (Late Entry setups).");
  }
  if (permissionCounts.blocked > permissionCounts.tradeAllowed) {
    tips.push("Most signals were rejected as risky — respect DO NOT TRADE labels.");
  }
  if (summary.refunds > 0) {
    tips.push("Review refund/tie trades — tighten entry timing to reduce dead results.");
  }
  if (summary.realTradeTotal < 15) {
    tips.push("Build at least 15 verified real-trade outcomes for meaningful win rate.");
  }

  if (tips.length === 0) {
    tips.push("Keep journaling every signal outcome to maintain analytics accuracy.");
    tips.push("Trade only Trade-Eligible / Strong Final signals during your best session.");
    tips.push("Stop after 2 consecutive losses and review loss reasons.");
  }

  if (tips.length < 3) {
    tips.push("Verify platform opening and closing quotes for every trade.");
  }

  return tips.slice(0, 5);
}

export function permissionCountsFromRows(
  rows: Array<{ signal_type?: string | null; trade_eligible?: boolean | null }>
) {
  let tradeAllowed = 0;
  let observe = 0;
  let blocked = 0;
  for (const r of rows) {
    const p = journalPermission(r.signal_type, r.trade_eligible);
    if (p === "TRADE ALLOWED") tradeAllowed++;
    else if (p === "OBSERVE ONLY") observe++;
    else blocked++;
  }
  return { tradeAllowed, observe, blocked };
}

export function signalTypeBucketStats(
  summary: Summary,
  rows: JournalRow[]
): Array<{ name: string; count: number; wins: number; losses: number; winRate: number }> {
  const permMap = new Map<string, { count: number; wins: number; losses: number }>();

  for (const label of SIGNAL_TYPE_BUCKETS) {
    permMap.set(label, { count: 0, wins: 0, losses: 0 });
  }

  for (const r of rows) {
    let bucket: string;
    const perm = journalPermission(r.signal_type, r.trade_eligible);
    if (perm === "TRADE ALLOWED") bucket = "TRADE ALLOWED";
    else if (perm === "DO NOT TRADE") bucket = "DO NOT TRADE";
    else if (r.signal_type === "STRONG FINAL") bucket = "STRONG FINAL";
    else if (r.signal_type === "FINAL TRADE") bucket = "FINAL TRADE";
    else if (r.signal_type === "WATCH ONLY") bucket = "WATCH ONLY";
    else if (r.signal_type === "LATE ENTRY") bucket = "LATE ENTRY";
    else if (r.signal_type === "REPEATED SIGNAL") bucket = "REPEATED SIGNAL";
    else if (r.signal_type === "TREND EXHAUSTED") bucket = "TREND EXHAUSTED";
    else bucket = "WATCH ONLY";

    const acc = permMap.get(bucket)!;
    acc.count++;
    if (r.result === "Win") acc.wins++;
    if (r.result === "Loss") acc.losses++;
  }

  return SIGNAL_TYPE_BUCKETS.map((name) => {
    const v = permMap.get(name)!;
    return {
      name,
      count: v.count,
      wins: v.wins,
      losses: v.losses,
      winRate: winRateFromAgg(v),
    };
  });
}

export function normalizedLossBreakdown(rows: JournalRow[]) {
  const counts: Record<string, number> = {};
  for (const label of LOSS_REASON_BUCKETS) counts[label] = 0;

  rows
    .filter((r) => r.result === "Loss")
    .forEach((r) => {
      const cat = normalizeLossReason(r.loss_reason);
      counts[cat] = (counts[cat] || 0) + 1;
    });

  return LOSS_REASON_BUCKETS.map((name) => ({ name, count: counts[name] || 0 }));
}

export function pairWinRates(summary: Summary) {
  return summary.pairPerformance
    .map((p) => ({
      name: p.name,
      wins: p.wins,
      losses: p.losses,
      winRate: winRateFromAgg(p),
      total: p.total,
    }))
    .filter((p) => p.wins + p.losses > 0)
    .sort((a, b) => b.winRate - a.winRate);
}

export function showDataQualityWarning(summary: Summary) {
  return summary.completedTrades < summary.totalSignals * 0.25 && summary.totalSignals > 0;
}
