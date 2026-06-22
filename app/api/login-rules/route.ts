import { requireApiAuth } from "@/lib/auth/apiAuth";
import { isSameCalendarDay, todayDateString } from "@/lib/risk/capitalProtection";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_CAPITAL_UNAVAILABLE, PLATFORM_RULES_SAVE_PENDING } from "@/lib/platform/userCopy";
import { sanitizeServiceWarning } from "@/lib/platform/sanitizeUserFacingError";
import { NextResponse } from "next/server";

async function readLoginRulesState(userId: string) {
  const select =
    "trading_rules_accepted, login_rules_seen_at, starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, daily_loss_limit_percent, max_consecutive_losses";

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select(select)
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      const fallback = await admin
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      return { data: fallback.data ? null : null, error: error.message, columnsReady: false };
    }
    return { data, error: null, columnsReady: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(select)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message, columnsReady: false };
  }
  return { data, error: null, columnsReady: true };
}

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const { data, error: readError, columnsReady } = await readLoginRulesState(auth!.user.id);

  if (!columnsReady) {
    return NextResponse.json({
      ok: true,
      showPopup: true,
      columnsReady: false,
      warning: sanitizeServiceWarning(readError) || PLATFORM_CAPITAL_UNAVAILABLE,
    });
  }

  if (!data) {
    return NextResponse.json({ ok: true, showPopup: true, reason: "no_profile" });
  }

  const today = todayDateString();
  const seenToday = isSameCalendarDay(data.login_rules_seen_at as string | null, today);
  const tradingRulesAccepted = Boolean(data.trading_rules_accepted);
  const showPopup = !tradingRulesAccepted || !seenToday;

  return NextResponse.json({
    ok: true,
    showPopup,
    tradingRulesAccepted,
    loginRulesSeenAt: data.login_rules_seen_at ?? null,
    columnsReady: true,
  });
}

export async function POST() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const now = new Date().toISOString();
  const patch = {
    trading_rules_accepted: true,
    login_rules_seen_at: now,
    updated_at: now,
  };

  let updateError: string | null = null;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { error: adminErr } = await admin.from("profiles").update(patch).eq("id", auth!.user.id);
    updateError = adminErr?.message ?? null;
  }

  if (updateError) {
    const supabase = await createClient();
    const { error: userErr } = await supabase.from("profiles").update(patch).eq("id", auth!.user.id);
    updateError = userErr?.message ?? updateError;
  } else if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = await createClient();
    const { error: userErr } = await supabase.from("profiles").update(patch).eq("id", auth!.user.id);
    updateError = userErr?.message ?? null;
  }

  if (updateError) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      warning: sanitizeServiceWarning(updateError) || PLATFORM_RULES_SAVE_PENDING,
      loginRulesSeenAt: now,
    });
  }

  return NextResponse.json({ ok: true, persisted: true, loginRulesSeenAt: now });
}
