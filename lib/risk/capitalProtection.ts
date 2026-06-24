import type { RecoveryMetrics, RiskStatus } from "./types";

export const RISK_DISCLAIMER =
  "This platform is for educational analysis, signal testing, and trade journaling only. It does not guarantee profit and does not provide financial advice. Trading involves risk.";

export const DEFAULT_COOLDOWN_MINUTES = 30;

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isSameCalendarDay(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  return new Date(a).toISOString().slice(0, 10) === b;
}

export function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function computeRecovery(
  startingCapital: number,
  currentCapital: number,
): RecoveryMetrics {
  const start = num(startingCapital);
  const current = num(currentCapital);

  if (start <= 0 || current <= 0) {
    return {
      lossAmount: 0,
      lossPercent: 0,
      requiredRecoveryPercent: 0,
      hasLoss: false,
      message: "Set starting capital first.",
    };
  }

  if (current >= start) {
    return {
      lossAmount: 0,
      lossPercent: 0,
      requiredRecoveryPercent: 0,
      hasLoss: false,
      message: null,
    };
  }

  const lossAmount = start - current;
  const lossPercent = (lossAmount / start) * 100;
  const requiredRecoveryPercent = (lossAmount / current) * 100;

  return {
    lossAmount,
    lossPercent,
    requiredRecoveryPercent,
    hasLoss: true,
    message: `You are down ${lossPercent.toFixed(1)}% from starting capital. To return to starting capital, you need ${requiredRecoveryPercent.toFixed(1)}% gain from current balance. Do not increase trade size emotionally.`,
  };
}

/**
 * Net P/L for a settled trade.
 *
 * Olymp Trade style: the Profit field is **gross profit** on a win (e.g. 400 on a 500 stake at 80%),
 * not total payout. On a win, net P/L equals that profit. On a loss, net P/L is −stake.
 * If someone enters total payout (stake + profit, e.g. 900), we detect when return > stake.
 */
export function computeNetProfit(
  tradeAmount: number,
  returnAmount: number,
  result: string,
  payoutPercent?: number,
): number {
  const amount = num(tradeAmount);
  const returned = num(returnAmount);
  const payout = num(payoutPercent);

  if (result === "Refund") {
    return 0;
  }

  if (result === "Loss") {
    if (returned === 0) return -amount;
    return returned - amount;
  }

  if (result === "Win") {
    if (amount <= 0) return returned;

    if (returned === 0 && payout > 0) {
      return amount * (payout / 100);
    }

    const expectedProfit = payout > 0 ? amount * (payout / 100) : null;

    // Total payout entered (stake + profit)
    if (returned > amount) {
      return returned - amount;
    }

    // Profit-only entry, or matches payout % (e.g. 400 on 500 @ 80%)
    if (
      returned < amount ||
      (expectedProfit != null && Math.abs(returned - expectedProfit) < 0.01) ||
      (returned === amount && expectedProfit != null && expectedProfit >= amount)
    ) {
      return returned;
    }

    return returned - amount;
  }

  return 0;
}

/** Fixed weekly profit goal (amount only — daily reference uses %). */
export function resolveWeeklyProfitTarget(weeklyProfitTargetAmount: number): number {
  return Math.max(0, num(weeklyProfitTargetAmount));
}

/** Monday 00:00 UTC for the week containing refDate (YYYY-MM-DD). */
export function weekStartDateString(refDate = todayDateString()): string {
  const d = new Date(`${refDate}T12:00:00.000Z`);
  const day = d.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

export function defaultWeeklyTargetRange(): { from: string; to: string } {
  const to = todayDateString();
  return { from: weekStartDateString(to), to };
}

export function normalizeDateInput(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const iso = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function resolveWeeklyTargetRange(
  from: string | null | undefined,
  to: string | null | undefined,
): { from: string; to: string } {
  const defaults = defaultWeeklyTargetRange();
  let fromDate = normalizeDateInput(from ?? "") || defaults.from;
  let toDate = normalizeDateInput(to ?? "") || defaults.to;
  if (toDate < fromDate) toDate = fromDate;
  return { from: fromDate, to: toDate };
}

export function deriveRiskStatus(
  consecutiveLosses: number,
  maxConsecutiveLosses: number,
  dailyLossLimitPercent: number,
  startingCapital: number,
  todayNetProfit: number,
): RiskStatus {
  if (consecutiveLosses >= maxConsecutiveLosses) return "stop";

  const start = num(startingCapital);
  if (start > 0 && todayNetProfit < 0) {
    const lossPct = (Math.abs(todayNetProfit) / start) * 100;
    if (lossPct >= dailyLossLimitPercent) return "stop";
    if (lossPct >= dailyLossLimitPercent * 0.6) return "caution";
  }

  if (consecutiveLosses >= maxConsecutiveLosses - 1) return "caution";
  return "normal";
}

export function cooldownActive(cooldownUntil: string | null | undefined): boolean {
  if (!cooldownUntil) return false;
  return new Date(cooldownUntil).getTime() > Date.now();
}

export function mapSignalTypeFilter(signalType: string | null, tradeEligible?: boolean | null): string {
  const t = (signalType || "").toUpperCase();
  if (t.includes("DO NOT TRADE")) return "Do Not Trade";
  if (t.includes("TREND EXHAUSTED")) return "Trend Exhausted";
  if (t.includes("REPEATED")) return "Repeated";
  if (t.includes("LATE")) return "Late Entry";
  if (t.includes("FINAL") || t.includes("STRONG") || tradeEligible) return "Trade Allowed";
  return "Watch Only";
}
