import { requireAdminApi } from "@/lib/admin/guard";
import type { PricingPlanInput } from "@/lib/pricing/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function parsePlanInput(body: Record<string, unknown>): PricingPlanInput | null {
  const name = String(body.name || "").trim();
  const price_label = String(body.price_label || "").trim();
  const best_for = String(body.best_for || "").trim();
  const access_description = String(body.access_description || "").trim();
  if (!name || !price_label || !best_for || !access_description) return null;

  return {
    name,
    price_label,
    best_for,
    access_description,
    sort_order:
      typeof body.sort_order === "number"
        ? body.sort_order
        : Number(body.sort_order) || 0,
    is_active: body.is_active !== false,
    is_highlighted: body.is_highlighted === true,
  };
}

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("pricing_plans")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }

  return NextResponse.json({ plans: data || [] });
}

export async function POST(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const input = parsePlanInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "name, price_label, best_for, and access_description are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error: insertError } = await admin
    .from("pricing_plans")
    .insert({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_create_pricing_plan",
    entity_type: "pricing_plans",
    entity_id: data.id,
    metadata: { name: input.name, price_label: input.price_label },
  });

  return NextResponse.json({ ok: true, plan: data });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const planId = String(body.planId || "");
  if (!planId) {
    return NextResponse.json({ error: "planId required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.price_label === "string") patch.price_label = body.price_label.trim();
  if (typeof body.best_for === "string") patch.best_for = body.best_for.trim();
  if (typeof body.access_description === "string") {
    patch.access_description = body.access_description.trim();
  }
  if (typeof body.sort_order === "number" || body.sort_order !== undefined) {
    patch.sort_order = Number(body.sort_order) || 0;
  }
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (typeof body.is_highlighted === "boolean") patch.is_highlighted = body.is_highlighted;

  const admin = createAdminClient();
  const { data, error: updateError } = await admin
    .from("pricing_plans")
    .update(patch)
    .eq("id", planId)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_update_pricing_plan",
    entity_type: "pricing_plans",
    entity_id: planId,
    metadata: patch,
  });

  return NextResponse.json({ ok: true, plan: data });
}

export async function DELETE(request: Request) {
  const { auth, error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("planId") || "";
  if (!planId) {
    return NextResponse.json({ error: "planId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: deleteError } = await admin.from("pricing_plans").delete().eq("id", planId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_delete_pricing_plan",
    entity_type: "pricing_plans",
    entity_id: planId,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
