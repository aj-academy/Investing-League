import { requireApiAuth } from "@/lib/auth/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildRiskStatusPayload,
  checkCapitalColumnsReady,
  getProfileCapitalFields,
  upsertDailyRiskSummary,
} from "@/lib/risk/dailyRiskSummary";
import { computeRecovery, num, todayDateString } from "@/lib/risk/capitalProtection";
import { NextResponse } from "next/server";

function isMigrationError(message: string) {
  return /column|schema cache|daily_risk_summary/i.test(message);
}

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const probe = await getProfileCapitalFields(auth!.user.id);
  if (!probe) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const columnsReady = await checkCapitalColumnsReady(auth!.user.id);
  const payload = await buildRiskStatusPayload(auth!.user.id);

  if (!payload) {
    return NextResponse.json({
      ok: true,
      columnsReady: false,
      riskStatus: "normal",
      liveModeLocked: false,
      cooldownUntil: null,
      cooldownActive: false,
      todayNetProfit: 0,
      consecutiveLosses: 0,
      profile: probe,
      recovery: computeRecovery(probe.starting_capital, probe.current_capital),
      warning: "Run supabase/migrations/capital_protection_plan.sql in Supabase SQL Editor.",
    });
  }

  return NextResponse.json({
    ok: true,
    columnsReady,
    warning: columnsReady
      ? undefined
      : "Run supabase/migrations/capital_protection_plan.sql in Supabase SQL Editor.",
    ...payload,
  });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const body = await request.json();
  const userId = auth!.user.id;

  const startingCapital = num(body.startingCapital);
  const currentCapital =
    body.currentCapital !== undefined ? num(body.currentCapital) : startingCapital;

  const patch = {
    starting_capital: startingCapital,
    current_capital: currentCapital,
    risk_per_trade_percent: num(body.riskPerTradePercent, 5),
    daily_profit_target_percent: num(body.dailyProfitTargetPercent, 10),
    daily_loss_limit_percent: num(body.dailyLossLimitPercent, 15),
    max_consecutive_losses: Math.max(1, Math.round(num(body.maxConsecutiveLosses, 3))),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  let updateError = (
    await supabase.from("profiles").update(patch).eq("id", userId)
  ).error;

  if (updateError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    updateError = (await admin.from("profiles").update(patch).eq("id", userId)).error;
  }

  if (updateError) {
    const migration = isMigrationError(updateError.message);
    return NextResponse.json(
      {
        error: migration
          ? "Database columns missing. Open Supabase → SQL Editor → run supabase/migrations/capital_protection_plan.sql"
          : updateError.message,
        code: migration ? "MIGRATION_REQUIRED" : "UPDATE_FAILED",
      },
      { status: 400 },
    );
  }

  const summaryResult = await upsertDailyRiskSummary(userId, {
    trade_date: todayDateString(),
    starting_capital: startingCapital,
    current_capital: currentCapital,
  });

  const profile = await getProfileCapitalFields(userId);
  const recovery = computeRecovery(
    profile?.starting_capital ?? startingCapital,
    profile?.current_capital ?? currentCapital,
  );

  return NextResponse.json({
    ok: true,
    columnsReady: true,
    profile,
    recovery,
    dailySummarySaved: !summaryResult.error,
    dailySummaryWarning: summaryResult.error,
  });
}
