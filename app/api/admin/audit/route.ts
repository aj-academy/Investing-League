import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const limit = Math.min(500, Math.max(10, Number(searchParams.get("limit") || "200")));

  const admin = createAdminClient();
  let query = admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (action) query = query.eq("action", action);

  const { data, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const logs = data || [];
  const userIds = [...new Set(logs.map((log) => log.user_id).filter(Boolean))] as string[];
  const nameByUserId = new Map<string, string>();

  if (userIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    for (const profile of profiles || []) {
      const label = profile.full_name?.trim() || profile.email?.trim() || profile.id;
      nameByUserId.set(profile.id, label);
    }
  }

  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      user_name: log.user_id ? nameByUserId.get(log.user_id) || null : null,
    })),
  });
}
