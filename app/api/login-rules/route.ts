import { requireApiAuth } from "@/lib/auth/apiAuth";
import { isSameCalendarDay, todayDateString } from "@/lib/risk/capitalProtection";
import { getProfileCapitalFields } from "@/lib/risk/dailyRiskSummary";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const profile = await getProfileCapitalFields(auth!.user.id);
  if (!profile) {
    return NextResponse.json({ ok: true, showPopup: true, reason: "no_profile" });
  }

  const today = todayDateString();
  const seenToday = isSameCalendarDay(profile.login_rules_seen_at, today);
  const showPopup = !profile.trading_rules_accepted || !seenToday;

  return NextResponse.json({
    ok: true,
    showPopup,
    tradingRulesAccepted: profile.trading_rules_accepted,
    loginRulesSeenAt: profile.login_rules_seen_at,
  });
}

export async function POST() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      trading_rules_accepted: true,
      login_rules_seen_at: now,
      updated_at: now,
    })
    .eq("id", auth!.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, loginRulesSeenAt: now });
}
