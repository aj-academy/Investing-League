import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeNetProfit,
  deriveRiskStatus,
  num,
  todayDateString,
} from "./capitalProtection";
import {
  aggregateTodayJournal,
  getProfileCapitalFields,
  refreshDailySummaryFromJournal,
} from "./dailyRiskSummary";

type JournalCapitalRow = {
  id: string;
  result: string;
  net_profit?: number | null;
  capital_before?: number | null;
  capital_after?: number | null;
  trade_amount?: number | null;
  return_amount?: number | null;
  payout_percent?: number | null;
};

export type JournalCapitalResult = {
  patch: Record<string, unknown>;
  profileCapital: number | null;
  capitalWarning: string | null;
  lossLimitReached: boolean;
  consecutiveLosses: number;
  liveModeLocked: boolean;
  cooldownUntil: string | null;
};

export async function applyJournalCapitalUpdate(
  userId: string,
  row: JournalCapitalRow,
  input: {
    tradeAmount?: number | null;
    payoutPercent?: number | null;
    returnAmount?: number | null;
    result: string;
  },
): Promise<JournalCapitalResult> {
  const profile = await getProfileCapitalFields(userId);
  const defaultResult: JournalCapitalResult = {
    patch: {},
    profileCapital: profile?.current_capital ?? null,
    capitalWarning: null,
    lossLimitReached: false,
    consecutiveLosses: 0,
    liveModeLocked: false,
    cooldownUntil: null,
  };

  if (!profile) return defaultResult;

  const tradeAmount =
    input.tradeAmount !== undefined && input.tradeAmount !== null
      ? num(input.tradeAmount)
      : num(row.trade_amount);
  const payoutPercent =
    input.payoutPercent !== undefined && input.payoutPercent !== null
      ? num(input.payoutPercent)
      : num(row.payout_percent);
  let returnAmount =
    input.returnAmount !== undefined && input.returnAmount !== null
      ? num(input.returnAmount)
      : num(row.return_amount);

  const result = input.result;

  if (returnAmount === 0 && payoutPercent > 0 && tradeAmount > 0 && result === "Win") {
    returnAmount = tradeAmount + tradeAmount * (payoutPercent / 100);
  }

  const settled = result === "Win" || result === "Loss" || result === "Refund";
  const patch: Record<string, unknown> = {
    trade_amount: tradeAmount,
    payout_percent: payoutPercent,
    return_amount: returnAmount,
  };

  if (!settled) {
    return { ...defaultResult, patch };
  }

  const netProfit = computeNetProfit(tradeAmount, returnAmount, result);
  const oldNet = num(row.net_profit);
  const profileCap = num(profile.current_capital);
  const startCap = num(profile.starting_capital);

  if (startCap <= 0 && profileCap <= 0) {
    return {
      ...defaultResult,
      patch: {
        ...patch,
        net_profit: netProfit,
        risk_status: "normal",
      },
      capitalWarning: "Set starting capital first.",
    };
  }

  let capitalBefore = row.capital_before != null ? num(row.capital_before) : null;
  if (capitalBefore === null) {
    if (row.capital_after != null && oldNet !== 0) {
      capitalBefore = num(row.capital_after) - oldNet;
    } else if (profileCap > 0) {
      capitalBefore = profileCap - oldNet;
    } else {
      capitalBefore = startCap > 0 ? startCap : 0;
    }
  }

  const capitalAfter = capitalBefore + netProfit;
  const newProfileCapital = profileCap - oldNet + netProfit;

  const agg = await aggregateTodayJournal(userId, todayDateString());
  let consecutiveLosses = agg.consecutiveLosses;

  const riskStatus = deriveRiskStatus(
    consecutiveLosses,
    profile.max_consecutive_losses,
    profile.daily_loss_limit_percent,
    profile.starting_capital,
    agg.netProfit + netProfit - oldNet,
  );

  patch.net_profit = netProfit;
  patch.capital_before = capitalBefore;
  patch.capital_after = capitalAfter;
  patch.consecutive_loss_count = consecutiveLosses;
  patch.risk_status = riskStatus;

  const admin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
  if (admin) {
    await admin
      .from("profiles")
      .update({
        current_capital: newProfileCapital,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  const lossLimitReached = consecutiveLosses >= profile.max_consecutive_losses;

  return {
    patch,
    profileCapital: newProfileCapital,
    capitalWarning: null,
    lossLimitReached,
    consecutiveLosses,
    liveModeLocked: lossLimitReached,
    cooldownUntil: null,
  };
}
