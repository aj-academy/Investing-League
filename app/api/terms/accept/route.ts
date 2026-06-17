import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getActiveTerms } from "@/lib/terms/terms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const active = await getActiveTerms();
  if (!active) {
    return NextResponse.json({ ok: true, accepted: true, active: null });
  }

  const ip = clientIp(request);
  const ua = request.headers.get("user-agent");
  const userId = auth!.user.id;
  const now = new Date().toISOString();

  const acceptanceRow = {
    user_id: userId,
    terms_id: active.id,
    accepted_at: now,
    ip_address: ip,
    user_agent: ua,
  };

  const profilePatch = {
    risk_disclaimer_accepted: true,
    disclaimer_accepted_at: now,
    updated_at: now,
  };

  let acceptError: string | null = null;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from("user_terms_acceptance")
      .upsert(acceptanceRow, { onConflict: "user_id,terms_id" });

    acceptError = upsertError?.message ?? null;

    if (!acceptError) {
      await admin.from("profiles").update(profilePatch).eq("id", userId);
      await admin.from("audit_logs").insert({
        user_id: userId,
        action: "user_accept_terms",
        entity_type: "terms_documents",
        entity_id: active.id,
        metadata: { version: active.version },
        ip_address: ip,
        user_agent: ua,
      });
    }
  } else {
    const supabase = await createClient();
    const { error: insertError } = await supabase
      .from("user_terms_acceptance")
      .insert(acceptanceRow);

    if (insertError) {
      if (insertError.code === "23505") {
        const { error: updateError } = await supabase
          .from("user_terms_acceptance")
          .update({
            accepted_at: now,
            ip_address: ip,
            user_agent: ua,
          })
          .eq("user_id", userId)
          .eq("terms_id", active.id);
        acceptError = updateError?.message ?? null;
      } else {
        acceptError = insertError.message;
      }
    }

    if (!acceptError) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profilePatch)
        .eq("id", userId);
      if (profileError) acceptError = profileError.message;
    }
  }

  if (acceptError) {
    const needsUpdatePolicy = /row-level security|policy/i.test(acceptError);
    return NextResponse.json(
      {
        error: needsUpdatePolicy
          ? "Terms save blocked by database security. Run supabase/migrations/terms_acceptance_rls_fix.sql in Supabase SQL Editor, and add SUPABASE_SERVICE_ROLE_KEY in Vercel."
          : acceptError,
        code: needsUpdatePolicy ? "RLS_BLOCKED" : "ACCEPT_FAILED",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, accepted: true, activeTermsId: active.id });
}
