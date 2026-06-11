import { requireAdminApi } from "@/lib/admin/guard";
import {
  CUSTOM_ASSET_EMPTY_MARKER,
  getPlanAllowedPairs,
  isCustomAssetEmptyMarker,
} from "@/lib/access/assetAccess";
import { ALL_PAIRS, normalizePlan } from "@/lib/billing/planLimits";
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

  const rows = (users || []).map((u) => {
    const planPairs = getPlanAllowedPairs(normalizePlan(u.plan));
    const customAccess = byUser.get(u.id) || [];
    const hasCustomAccess = customAccess.length > 0;
    const isEmptyCustom = customAccess.some((r) => isCustomAssetEmptyMarker(r.pair));
    const enabledCustom = customAccess
      .filter((r) => r.is_allowed && !isCustomAssetEmptyMarker(r.pair))
      .map((r) => r.pair);
    return {
      ...u,
      all_pairs: ALL_PAIRS,
      plan_pairs: planPairs,
      has_custom_access: hasCustomAccess,
      is_empty_custom: isEmptyCustom,
      custom_access: customAccess.filter((r) => !isCustomAssetEmptyMarker(r.pair)),
    };
  });
  return NextResponse.json({ users: rows });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const userId = String(body.userId || "");
  const allowedPairs = Array.isArray(body.allowedPairs) ? body.allowedPairs : [];
  const usePlanDefault = Boolean(body.usePlanDefault);
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

  if (!usePlanDefault) {
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
    } else {
      const { error: emptyError } = await admin.from("user_asset_access").insert({
        user_id: userId,
        pair: CUSTOM_ASSET_EMPTY_MARKER,
        is_allowed: false,
        assigned_by: auth!.user.id,
      });
      if (emptyError) {
        return NextResponse.json({ error: emptyError.message }, { status: 500 });
      }
    }
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_update_assets",
    entity_type: "user_asset_access",
    entity_id: userId,
    metadata: {
      usePlanDefault,
      allowedPairs: usePlanDefault ? null : sanitized,
    },
  });

  return NextResponse.json({
    ok: true,
    userId,
    usePlanDefault,
    allowedPairs: usePlanDefault ? null : sanitized,
  });
}
