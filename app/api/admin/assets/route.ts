import { requireAdminApi } from "@/lib/admin/guard";
import { ALL_PAIRS } from "@/lib/billing/planLimits";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const admin = createAdminClient();
  const [{ data: users }, { data: access }] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,full_name,plan,is_active")
      .order("created_at", { ascending: false }),
    admin
      .from("user_asset_access")
      .select("user_id,pair,is_allowed,updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  const byUser = new Map<string, { pair: string; is_allowed: boolean }[]>();
  for (const row of access || []) {
    const list = byUser.get(row.user_id) || [];
    list.push({ pair: row.pair, is_allowed: row.is_allowed });
    byUser.set(row.user_id, list);
  }

  const rows = (users || []).map((u) => ({
    ...u,
    all_pairs: ALL_PAIRS,
    custom_access: byUser.get(u.id) || [],
  }));
  return NextResponse.json({ users: rows });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const userId = String(body.userId || "");
  const allowedPairs = Array.isArray(body.allowedPairs) ? body.allowedPairs : [];
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const valid = new Set(ALL_PAIRS);
  const sanitized = allowedPairs.filter((p: string) => valid.has(p as (typeof ALL_PAIRS)[number]));

  const admin = createAdminClient();
  const clearResult = await admin.from("user_asset_access").delete().eq("user_id", userId);
  if (clearResult.error) {
    return NextResponse.json({ error: clearResult.error.message }, { status: 500 });
  }

  if (sanitized.length) {
    const rows = sanitized.map((pair: string) => ({
      user_id: userId,
      pair,
      is_allowed: true,
      assigned_by: auth!.user.id,
    }));
    const { error: upsertError } = await admin
      .from("user_asset_access")
      .upsert(rows, { onConflict: "user_id,pair" });
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_update_assets",
    entity_type: "user_asset_access",
    entity_id: userId,
    metadata: { allowedPairs: sanitized },
  });

  return NextResponse.json({ ok: true, userId, allowedPairs: sanitized });
}
