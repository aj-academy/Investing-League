import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function acceptanceSummary(admin = createAdminClient()) {
  const { data: active } = await admin
    .from("terms_documents")
    .select("id,version,title,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: totalUsers } = await admin
    .from("profiles")
    .select("id", { head: true, count: "exact" })
    .eq("is_active", true);

  let acceptedCount = 0;
  if (active?.id) {
    const { count } = await admin
      .from("user_terms_acceptance")
      .select("id", { head: true, count: "exact" })
      .eq("terms_id", active.id);
    acceptedCount = count || 0;
  }

  return {
    active,
    totalUsers: totalUsers || 0,
    acceptedCount,
    pendingCount: Math.max(0, (totalUsers || 0) - acceptedCount),
  };
}

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const admin = createAdminClient();
  const [{ data: terms }, summary] = await Promise.all([
    admin
      .from("terms_documents")
      .select("*")
      .order("created_at", { ascending: false }),
    acceptanceSummary(admin),
  ]);

  return NextResponse.json({
    terms: terms || [],
    active: summary.active,
    acceptanceSummary: {
      totalUsers: summary.totalUsers,
      accepted: summary.acceptedCount,
      pending: summary.pendingCount,
    },
  });
}

export async function POST(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const title = String(body.title || "").trim();
  const version = String(body.version || "").trim();
  const content = typeof body.content === "string" ? body.content : null;
  const fileUrl = typeof body.file_url === "string" && body.file_url.trim() ? body.file_url.trim() : null;
  const activate = Boolean(body.activate);

  if (!title || !version) {
    return NextResponse.json({ error: "title and version are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (activate) {
    await admin.from("terms_documents").update({ is_active: false }).eq("is_active", true);
  }
  const { data, error: insertError } = await admin
    .from("terms_documents")
    .insert({
      title,
      version,
      content,
      file_url: fileUrl,
      is_active: activate,
      created_by: auth!.user.id,
      requires_reacceptance: true,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_create_terms",
    entity_type: "terms_documents",
    entity_id: data.id,
    metadata: { title, version, activate },
  });

  return NextResponse.json({ ok: true, terms: data });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const termsId = String(body.termsId || "");
  const activate = body.activate === true;
  if (!termsId) {
    return NextResponse.json({ error: "termsId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (activate) {
    await admin.from("terms_documents").update({ is_active: false }).eq("is_active", true);
  }
  const { data, error: updateError } = await admin
    .from("terms_documents")
    .update({
      is_active: activate,
      requires_reacceptance:
        typeof body.requires_reacceptance === "boolean"
          ? body.requires_reacceptance
          : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", termsId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_activate_terms",
    entity_type: "terms_documents",
    entity_id: termsId,
    metadata: { activate, version: data.version },
  });

  return NextResponse.json({ ok: true, terms: data });
}
