import { requireApiAuth } from "@/lib/auth/apiAuth";
import {
  buildRiskStatusPayload,
  checkCapitalColumnsReady,
  getProfileCapitalFields,
  upsertDailyRiskSummary,
} from "@/lib/risk/dailyRiskSummary";
import { persistCapitalProfile } from "@/lib/risk/persistCapitalProfile";
import { computeRecovery, num, todayDateString } from "@/lib/risk/capitalProtection";
import {
  PLATFORM_CAPITAL_UNAVAILABLE,
  PLATFORM_DAILY_TARGET_AMOUNT_PENDING,
} from "@/lib/platform/userCopy";
import { isSchemaColumnError } from "@/lib/risk/capitalProfileColumns";
import { sanitizeUserFacingError } from "@/lib/platform/sanitizeUserFacingError";
import { NextResponse } from "next/server";

function isMigrationError(message: string) {
  return isSchemaColumnError(message);
}

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const columnsReady = await checkCapitalColumnsReady(auth!.user.id);
  const probe = await getProfileCapitalFields(auth!.user.id);

  if (!probe) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const payload = await buildRiskStatusPayload(auth!.user.id);
  const schemaWarning = columnsReady
    ? undefined
    : PLATFORM_CAPITAL_UNAVAILABLE;

  if (!payload) {
    return NextResponse.json({
      ok: true,
      columnsReady,
      riskStatus: "normal",
      liveModeLocked: false,
      cooldownUntil: null,
      cooldownActive: false,
      todayNetProfit: 0,
      consecutiveLosses: 0,
      profile: probe,
      recovery: computeRecovery(probe.starting_capital, probe.current_capital),
      warning: schemaWarning ?? "Could not load full risk summary.",
    });
  }

  return NextResponse.json({
    ok: true,
    columnsReady,
    warning: schemaWarning,
    ...payload,
  });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const body = await request.json();
  const userId = auth!.user.id;
  const email = auth!.user.email ?? "";

  const startingCapital = num(body.startingCapital);
  const currentCapital =
    body.currentCapital !== undefined ? num(body.currentCapital) : startingCapital;

  if (startingCapital <= 0) {
    return NextResponse.json(
      { error: "Starting capital must be greater than 0." },
      { status: 400 },
    );
  }

  if (currentCapital < 0) {
    return NextResponse.json({ error: "Current capital cannot be negative." }, { status: 400 });
  }

  const patch = {
    starting_capital: startingCapital,
    current_capital: currentCapital,
    risk_per_trade_percent: num(body.riskPerTradePercent, 5),
    daily_profit_target_percent: num(body.dailyProfitTargetPercent, 10),
    daily_profit_target_amount: Math.max(0, num(body.dailyProfitTargetAmount)),
    daily_loss_limit_percent: num(body.dailyLossLimitPercent, 15),
    max_consecutive_losses: Math.max(1, Math.round(num(body.maxConsecutiveLosses, 3))),
    updated_at: new Date().toISOString(),
  };

  const { profile: savedProfile, error: persistError, dailyTargetAmountSaved } =
    await persistCapitalProfile(userId, email, patch);

  if (persistError || !savedProfile) {
    const migration = isMigrationError(persistError ?? "");
    return NextResponse.json(
      {
        error: migration ? PLATFORM_CAPITAL_UNAVAILABLE : sanitizeUserFacingError(persistError),
        code: migration ? "MIGRATION_REQUIRED" : "UPDATE_FAILED",
      },
      { status: 400 },
    );
  }

  const summaryResult = await upsertDailyRiskSummary(userId, {
    trade_date: todayDateString(),
    starting_capital: savedProfile.starting_capital,
    current_capital: savedProfile.current_capital,
  });

  const recovery = computeRecovery(
    savedProfile.starting_capital,
    savedProfile.current_capital,
  );

  return NextResponse.json({
    ok: true,
    columnsReady: true,
    profile: savedProfile,
    recovery,
    dailyTargetAmountSaved,
    warning: dailyTargetAmountSaved ? undefined : PLATFORM_DAILY_TARGET_AMOUNT_PENDING,
    dailySummarySaved: !summaryResult.error,
    dailySummaryWarning: summaryResult.error,
  });
}
