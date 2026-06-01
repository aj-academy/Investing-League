import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getProfileByUserId } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function requireAdmin(userId: string) {
  const profile = await getProfileByUserId(userId);
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;
  const forbidden = await requireAdmin(auth!.user.id);
  if (forbidden) return forbidden;

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("profiles")
    .select("id, email, full_name, role, plan, is_active, created_at")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ users: data || [] });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;
  const forbidden = await requireAdmin(auth!.user.id);
  if (forbidden) return forbidden;

  const body = await request.json();
  const userId = String(body.userId || "");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.plan && ["free", "starter", "pro", "admin"].includes(body.plan)) {
    patch.plan = body.plan;
  }
  if (body.role && ["user", "admin"].includes(body.role)) {
    patch.role = body.role;
  }
  if (typeof body.is_active === "boolean") {
    patch.is_active = body.is_active;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id, email, full_name, role, plan, is_active")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_update_user",
    entity_type: "profiles",
    entity_id: userId,
    metadata: { patch, target: data?.email },
  });

  return NextResponse.json({ ok: true, user: data });
}
