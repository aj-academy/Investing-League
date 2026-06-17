import { requireApiAuth } from "@/lib/auth/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  buildRiskStatusPayload,
  checkCapitalColumnsReady,
  getProfileCapitalFields,
  upsertDailyRiskSummary,
} from "@/lib/risk/dailyRiskSummary";
import type { CapitalProfileFields } from "@/lib/risk/types";
import { computeRecovery, num, todayDateString } from "@/lib/risk/capitalProtection";
import { NextResponse } from "next/server";

function isMigrationError(message: string) {
  return /column|schema cache/i.test(message);
}

function profileFromPatch(
  userId: string,
  patch: Record<string, unknown>,
  existing?: CapitalProfileFields | null,
): CapitalProfileFields {
  return {
    starting_capital: num(patch.starting_capital),
    current_capital: num(patch.current_capital),
    risk_per_trade_percent: num(patch.risk_per_trade_percent, 5),
    daily_profit_target_percent: num(patch.daily_profit_target_percent, 10),
    daily_loss_limit_percent: num(patch.daily_loss_limit_percent, 15),
    max_consecutive_losses: num(patch.max_consecutive_losses, 3),
    trading_rules_accepted: existing?.trading_rules_accepted ?? false,
    login_rules_seen_at: existing?.login_rules_seen_at ?? null,
  };
}

function profileFromRow(row: Record<string, unknown>): CapitalProfileFields {
  return {
    starting_capital: num(row.starting_capital),
    current_capital: num(row.current_capital),
    risk_per_trade_percent: num(row.risk_per_trade_percent, 5),
    daily_profit_target_percent: num(row.daily_profit_target_percent, 10),
    daily_loss_limit_percent: num(row.daily_loss_limit_percent, 15),
    max_consecutive_losses: num(row.max_consecutive_losses, 3),
    trading_rules_accepted: Boolean(row.trading_rules_accepted),
    login_rules_seen_at: (row.login_rules_seen_at as string | null) ?? null,
  };
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
    : "Run capital_protection_plan.sql in Supabase, then run: NOTIFY pgrst, 'reload schema';";

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
    daily_loss_limit_percent: num(body.dailyLossLimitPercent, 15),
    max_consecutive_losses: Math.max(1, Math.round(num(body.maxConsecutiveLosses, 3))),
    updated_at: new Date().toISOString(),
  };

  const existing = await getProfileCapitalFields(userId);
  let savedProfile = profileFromPatch(userId, patch, existing);
  let persistError: string | null = null;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data, error: upsertError } = await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          ...patch,
        },
        { onConflict: "id" },
      )
      .select(
        "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at",
      )
      .single();

    if (upsertError) {
      persistError = upsertError.message;
    } else if (data) {
      savedProfile = profileFromRow(data as Record<string, unknown>);
    }
  } else {
    const supabase = await createClient();
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select(
        "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_loss_limit_percent, max_consecutive_losses, trading_rules_accepted, login_rules_seen_at",
      )
      .maybeSingle();

    if (updateError) {
      persistError = updateError.message;
    } else if (data) {
      savedProfile = profileFromRow(data as Record<string, unknown>);
    } else {
      persistError = "Profile row not found — contact support or re-login.";
    }
  }

  if (persistError) {
    const migration = isMigrationError(persistError);
    return NextResponse.json(
      {
        error: migration
          ? "Database columns missing or schema cache stale. Run capital_protection_plan.sql then NOTIFY pgrst, 'reload schema'; in Supabase SQL Editor."
          : persistError,
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
    dailySummarySaved: !summaryResult.error,
    dailySummaryWarning: summaryResult.error,
  });
}
