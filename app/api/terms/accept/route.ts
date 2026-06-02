import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getActiveTerms } from "@/lib/terms/terms";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const admin = createAdminClient();
  const ip = clientIp(request);
  const ua = request.headers.get("user-agent");

  const { error: upsertError } = await admin
    .from("user_terms_acceptance")
    .upsert(
      {
        user_id: auth!.user.id,
        terms_id: active.id,
        accepted_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: ua,
      },
      { onConflict: "user_id,terms_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  await admin
    .from("profiles")
    .update({
      risk_disclaimer_accepted: true,
      disclaimer_accepted_at: new Date().toISOString(),
    })
    .eq("id", auth!.user.id);

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "user_accept_terms",
    entity_type: "terms_documents",
    entity_id: active.id,
    metadata: { version: active.version },
    ip_address: ip,
    user_agent: ua,
  });

  return NextResponse.json({ ok: true, accepted: true, activeTermsId: active.id });
}
