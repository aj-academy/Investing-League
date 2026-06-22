import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getActiveTerms, hasValidServiceRoleKey } from "@/lib/terms/terms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_SAVE_FAILED } from "@/lib/platform/userCopy";
import { sanitizeUserFacingError } from "@/lib/platform/sanitizeUserFacingError";
import { NextResponse } from "next/server";

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

async function saveTermsAcceptance(
  userId: string,
  acceptanceRow: {
    user_id: string;
    terms_id: string;
    accepted_at: string;
    ip_address: string | null;
    user_agent: string | null;
  },
  profilePatch: {
    risk_disclaimer_accepted: boolean;
    disclaimer_accepted_at: string;
    updated_at: string;
  },
) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("user_terms_acceptance")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_id", acceptanceRow.terms_id)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from("user_terms_acceptance")
      .update({
        accepted_at: acceptanceRow.accepted_at,
        ip_address: acceptanceRow.ip_address,
        user_agent: acceptanceRow.user_agent,
      })
      .eq("user_id", userId)
      .eq("terms_id", acceptanceRow.terms_id);

    if (updateError) return updateError.message;
  } else {
    const { error: insertError } = await supabase
      .from("user_terms_acceptance")
      .insert(acceptanceRow);

    if (insertError) return insertError.message;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profilePatch)
    .eq("id", userId);

  return profileError?.message ?? null;
}

async function saveTermsAcceptanceAdmin(
  userId: string,
  acceptanceRow: {
    user_id: string;
    terms_id: string;
    accepted_at: string;
    ip_address: string | null;
    user_agent: string | null;
  },
  profilePatch: {
    risk_disclaimer_accepted: boolean;
    disclaimer_accepted_at: string;
    updated_at: string;
  },
  auditMeta: { termsId: string; version: string; ip: string | null; ua: string | null },
) {
  const admin = createAdminClient();
  const { error: upsertError } = await admin
    .from("user_terms_acceptance")
    .upsert(acceptanceRow, { onConflict: "user_id,terms_id" });

  if (upsertError) return upsertError.message;

  await admin.from("profiles").update(profilePatch).eq("id", userId);
  await admin.from("audit_logs").insert({
    user_id: userId,
    action: "user_accept_terms",
    entity_type: "terms_documents",
    entity_id: auditMeta.termsId,
    metadata: { version: auditMeta.version },
    ip_address: auditMeta.ip,
    user_agent: auditMeta.ua,
  });

  return null;
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

  // Prefer logged-in user session (works when RLS policies are correct)
  let acceptError = await saveTermsAcceptance(userId, acceptanceRow, profilePatch);

  // Fallback: service role bypasses RLS (must be real service_role key, not anon)
  if (acceptError && hasValidServiceRoleKey()) {
    acceptError = await saveTermsAcceptanceAdmin(
      userId,
      acceptanceRow,
      profilePatch,
      { termsId: active.id, version: active.version, ip, ua },
    );
  }

  if (acceptError) {
    const rlsBlocked = /row-level security|policy/i.test(acceptError);
    return NextResponse.json(
      {
        error: sanitizeUserFacingError(acceptError, PLATFORM_SAVE_FAILED),
        code: rlsBlocked ? "RLS_BLOCKED" : "ACCEPT_FAILED",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, accepted: true, activeTermsId: active.id });
}
