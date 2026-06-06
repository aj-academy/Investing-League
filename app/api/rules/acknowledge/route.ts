import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getActiveRules } from "@/lib/rules/rules";
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

  const active = await getActiveRules();
  if (!active) {
    return NextResponse.json({ ok: true, acknowledged: true, active: null });
  }

  const admin = createAdminClient();
  const ip = clientIp(request);
  const ua = request.headers.get("user-agent");
  const now = new Date().toISOString();

  const { error: upsertError } = await admin.from("user_rules_acknowledgement").upsert(
    {
      user_id: auth!.user.id,
      rules_id: active.id,
      acknowledged_at: now,
    },
    { onConflict: "user_id,rules_id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "user_acknowledge_rules",
    entity_type: "rules_documents",
    entity_id: active.id,
    metadata: { title: active.title },
    ip_address: ip,
    user_agent: ua,
  });

  return NextResponse.json({ ok: true, acknowledged: true, rulesId: active.id });
}
