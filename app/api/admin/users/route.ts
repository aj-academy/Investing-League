import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getProfileByUserId } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function requireAdmin(userId: string) {
  const profile = await getProfileByUserId(userId);
  if (profile?.role !== "admin" || profile?.is_active === false) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function startOfUtcDayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function GET() {
  const { auth, error } = await requireApiAuth({ adminOnly: true });
  if (error) return error;
  const forbidden = await requireAdmin(auth!.user.id);
  if (forbidden) return forbidden;

  const admin = createAdminClient();
  const [
    { data, error: dbError },
    { data: usageRows, error: usageError },
    { data: activeTerms },
    { data: userAcceptances },
    { data: assets },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, email, full_name, role, plan, is_active, risk_disclaimer_accepted, created_at"
      )
      .order("created_at", { ascending: false }),
    admin
      .from("usage_logs")
      .select("user_id,action,provider_calls,cache_hits")
      .gte("created_at", startOfUtcDayIso()),
    admin
      .from("terms_documents")
      .select("id,version")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("user_terms_acceptance")
      .select("user_id,accepted_at,terms_id")
      .order("accepted_at", { ascending: false }),
    admin.from("user_asset_access").select("user_id,pair,is_allowed"),
  ]);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  if (usageError) {
    return NextResponse.json({ error: usageError.message }, { status: 500 });
  }

  const usageByUser = new Map<
    string,
    { scans_today: number; provider_calls_today: number; cache_hits_today: number }
  >();
  for (const row of usageRows || []) {
    if (!row.user_id) continue;
    const acc = usageByUser.get(row.user_id) || {
      scans_today: 0,
      provider_calls_today: 0,
      cache_hits_today: 0,
    };
    if (row.action === "scan_market") acc.scans_today += 1;
    acc.provider_calls_today += Number(row.provider_calls || 0);
    acc.cache_hits_today += Number(row.cache_hits || 0);
    usageByUser.set(row.user_id, acc);
  }

  const termsByUser = new Map<string, { accepted_at: string; accepted: boolean }>();
  if (activeTerms?.id) {
    for (const row of userAcceptances || []) {
      if (row.terms_id !== activeTerms.id) continue;
      if (!termsByUser.has(row.user_id)) {
        termsByUser.set(row.user_id, { accepted_at: row.accepted_at, accepted: true });
      }
    }
  }

  const allowedAssetsCountByUser = new Map<string, number>();
  for (const row of assets || []) {
    if (!row.is_allowed) continue;
    allowedAssetsCountByUser.set(
      row.user_id,
      (allowedAssetsCountByUser.get(row.user_id) || 0) + 1
    );
  }

  const users = (data || []).map((u) => {
    const usage = usageByUser.get(u.id);
    const terms = termsByUser.get(u.id);
    return {
      ...u,
      terms_accepted_version: terms?.accepted ? activeTerms?.version || null : null,
      terms_accepted_at: terms?.accepted_at || null,
      allowed_assets_count: allowedAssetsCountByUser.get(u.id) || null,
      scans_today: usage?.scans_today || 0,
      provider_calls_today: usage?.provider_calls_today || 0,
      cache_hits_today: usage?.cache_hits_today || 0,
    };
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const { auth, error } = await requireApiAuth({ adminOnly: true });
  if (error) return error;
  const forbidden = await requireAdmin(auth!.user.id);
  if (forbidden) return forbidden;

  const body = await request.json();
  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = body.role === "admin" ? "admin" : "user";
  const plan =
    body.plan === "starter" || body.plan === "pro" || body.plan === "admin"
      ? body.plan
      : "free";
  const isActive = body.is_active !== false;

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || null },
  });
  if (createError || !authUser.user) {
    return NextResponse.json({ error: createError?.message || "Could not create user" }, { status: 400 });
  }

  const userId = authUser.user.id;
  const profileRow = {
    id: userId,
    email,
    full_name: fullName || null,
    role,
    plan,
    is_active: isActive,
  };

  const [{ error: profileError }, { error: settingsError }] = await Promise.all([
    admin.from("profiles").upsert(profileRow, { onConflict: "id" }),
    admin
      .from("user_settings")
      .upsert(
        {
          user_id: userId,
          default_mode: "practice",
          default_timeframe: "5min",
          default_min_score: 5,
          show_b_signals: true,
        },
        { onConflict: "user_id" }
      ),
  ]);

  if (profileError || settingsError) {
    return NextResponse.json(
      { error: profileError?.message || settingsError?.message || "User bootstrap failed" },
      { status: 500 }
    );
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action: "admin_create_user",
    entity_type: "profiles",
    entity_id: userId,
    metadata: { target_email: email, role, plan, is_active: isActive },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      email,
      full_name: fullName || null,
      role,
      plan,
      is_active: isActive,
    },
  });
}

export async function PATCH(request: Request) {
  const { auth, error } = await requireApiAuth({ adminOnly: true });
  if (error) return error;
  const forbidden = await requireAdmin(auth!.user.id);
  if (forbidden) return forbidden;

  const body = await request.json();
  const userId = String(body.userId || "");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  if (userId === auth!.user.id && body.is_active === false) {
    return NextResponse.json({ error: "You cannot suspend your own admin account." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.full_name === "string") {
    patch.full_name = body.full_name.trim() || null;
  }
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
  const { data: before } = await admin
    .from("profiles")
    .select("id, email, role, plan, is_active")
    .eq("id", userId)
    .maybeSingle();

  const { data, error: updateError } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id, email, full_name, role, plan, is_active")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  let action = "admin_update_user";
  if (Object.prototype.hasOwnProperty.call(patch, "is_active")) {
    action = patch.is_active === false ? "admin_suspend_user" : "admin_reactivate_user";
  } else if (Object.prototype.hasOwnProperty.call(patch, "plan")) {
    action = "admin_update_plan";
  }

  await admin.from("audit_logs").insert({
    user_id: auth!.user.id,
    action,
    entity_type: "profiles",
    entity_id: userId,
    metadata: { patch, before, after: data, target: data?.email },
  });

  return NextResponse.json({ ok: true, user: data });
}
