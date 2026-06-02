import { requireApiAuth } from "@/lib/auth/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { auth, error } = await requireApiAuth({ adminOnly: true });
  if (error) return error;

  const admin = createAdminClient();
  const [users, signals, journal, usage] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("signals").select("id", { count: "exact", head: true }),
    admin.from("trade_journal").select("id", { count: "exact", head: true }),
    admin
      .from("usage_logs")
      .select("id,user_id,action,mode,created_at,metadata,provider_calls,cache_hits,estimated_provider_calls")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    totalUsers: users.count || 0,
    signalsGenerated: signals.count || 0,
    journalRecords: journal.count || 0,
    usageLogs: usage.data || [],
  });
}
