import { requireAdminApi } from "@/lib/admin/guard";
import { getActiveRules } from "@/lib/rules/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const active = await getActiveRules();
  return NextResponse.json({ active });
}

export async function PUT(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const title = String(body.title || "Platform Rules").trim();
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Rules content is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const existing = await getActiveRules();
  const now = new Date().toISOString();

  if (existing?.id) {
    const { data, error: updateError } = await admin
      .from("rules_documents")
      .update({
        title,
        content,
        updated_by: auth!.user.id,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    await admin.from("audit_logs").insert({
      user_id: auth!.user.id,
      action: "admin_update_rules",
      entity_type: "rules_documents",
      entity_id: existing.id,
      metadata: { title },
    });

    return NextResponse.json({ ok: true, rules: data });
  }

  const { data, error: insertError } = await admin
    .from("rules_documents")
    .insert({
      title,
      content,
      is_active: true,
      updated_by: auth!.user.id,
      updated_at: now,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_create_rules",
    entity_type: "rules_documents",
    entity_id: data.id,
    metadata: { title },
  });

  return NextResponse.json({ ok: true, rules: data });
}
