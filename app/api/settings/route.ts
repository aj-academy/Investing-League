import { requireApiAuth } from "@/lib/auth/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const userId = auth!.user.id;
  const email = auth!.user.email;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server (add it in Vercel env)." },
      { status: 500 }
    );
  }

  // Service role ensures profile row can be created (RLS insert often missing on older DBs).
  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").upsert(
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

  const supabase = await createClient();
  const { data: existingSettings } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingSettings) {
    const { error: settingsError } = await supabase
      .from("user_settings")
      .update({
        default_mode: mode,
        default_timeframe: timeframe,
        default_min_score: minScore,
        show_b_signals: showB,
      })
      .eq("user_id", userId);

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 400 });
    }
  } else {
    const { error: settingsError } = await admin.from("user_settings").upsert(
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
  }

  return NextResponse.json({ ok: true });
}
