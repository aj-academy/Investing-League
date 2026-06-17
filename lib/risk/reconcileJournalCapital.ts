import { createAdminClient } from "@/lib/supabase/admin";
import { computeNetProfit, num } from "./capitalProtection";
import {
  getProfileCapitalFields,
  refreshDailySummaryFromJournal,
} from "./dailyRiskSummary";

type JournalRowForReconcile = {
  id: string;
  result: string;
  trade_amount: number | null;
  return_amount: number | null;
  payout_percent: number | null;
  net_profit: number | null;
  capital_before: number | null;
  capital_after: number | null;
};

/**
 * Fix journal rows where net_profit was stored with the old formula (return − stake on wins).
 * Adjusts profile current_capital and refreshes today's daily summary.
 */
export async function reconcileJournalCapitalForUser(userId: string): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;

  const admin = createAdminClient();
  const profile = await getProfileCapitalFields(userId);
  if (!profile) return false;

  const { data, error } = await admin
    .from("trade_journal")
    .select(
      "id, result, trade_amount, return_amount, payout_percent, net_profit, capital_before, capital_after",
    )
    .eq("user_id", userId)
    .in("result", ["Win", "Loss", "Refund"]);

  if (error || !data?.length) return false;

  let profileDelta = 0;
  let changed = false;

  for (const row of data as JournalRowForReconcile[]) {
    const tradeAmount = num(row.trade_amount);
    const returnAmount = num(row.return_amount);
    const payoutPercent = num(row.payout_percent);
    const oldNet = num(row.net_profit);
    const expected = computeNetProfit(
      tradeAmount,
      returnAmount,
      row.result,
      payoutPercent,
    );

    if (Math.abs(expected - oldNet) < 0.01) continue;

    const capitalBefore =
      row.capital_before != null
        ? num(row.capital_before)
        : row.capital_after != null && oldNet !== 0
          ? num(row.capital_after) - oldNet
          : null;

    const patch: Record<string, unknown> = {
      net_profit: expected,
      updated_at: new Date().toISOString(),
    };

    if (capitalBefore != null) {
      patch.capital_after = capitalBefore + expected;
    }

    const { error: updateError } = await admin
      .from("trade_journal")
      .update(patch)
      .eq("id", row.id)
      .eq("user_id", userId);

    if (!updateError) {
      profileDelta += expected - oldNet;
      changed = true;
    }
  }

  if (!changed) return false;

  const newCapital = num(profile.current_capital) + profileDelta;
  await admin
    .from("profiles")
    .update({
      current_capital: newCapital,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await refreshDailySummaryFromJournal(userId, {
    ...profile,
    current_capital: newCapital,
  });

  return true;
}
