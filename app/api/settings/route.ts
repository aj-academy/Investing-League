import { requireApiAuth } from "@/lib/auth/apiAuth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const body = await request.json();
  const fullName = String(body.fullName ?? "").trim();
  const accepted = Boolean(body.riskDisclaimerAccepted);
  const mode = body.defaultMode === "live" ? "live" : "practice";
  const timeframe = body.defaultTimeframe === "15min" ? "15min" : "5min";
  const minScore = Number(body.defaultMinScore ?? 5);
  const showB = body.showBSignals !== false;

  const supabase = await createClient();
  const userId = auth!.user.id;
  const email = auth!.user.email;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName || null,
      risk_disclaimer_accepted: accepted,
      disclaimer_accepted_at: accepted ? new Date().toISOString() : null,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: settingsError } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      default_mode: mode,
      default_timeframe: timeframe,
      default_min_score: minScore,
      show_b_signals: showB,
    },
    { onConflict: "user_id" }
  );

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
