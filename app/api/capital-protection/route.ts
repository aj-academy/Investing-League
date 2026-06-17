import { requireApiAuth } from "@/lib/auth/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildRiskStatusPayload,
  getProfileCapitalFields,
  upsertDailyRiskSummary,
} from "@/lib/risk/dailyRiskSummary";
import { computeRecovery, num, todayDateString } from "@/lib/risk/capitalProtection";
import { NextResponse } from "next/server";

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const payload = await buildRiskStatusPayload(auth!.user.id);
  if (!payload) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...payload });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const body = await request.json();
  const admin = createAdminClient();
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

  const { error: updateError } = await admin.from("profiles").update(patch).eq("id", userId);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await upsertDailyRiskSummary(userId, {
    trade_date: todayDateString(),
    starting_capital: startingCapital,
    current_capital: currentCapital,
  });

  const profile = await getProfileCapitalFields(userId);
  const recovery = computeRecovery(
    profile?.starting_capital ?? 0,
    profile?.current_capital ?? 0,
  );

  return NextResponse.json({ ok: true, profile, recovery });
}
