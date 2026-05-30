import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getDemoJournal } from "@/lib/demo/mockStore";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  if (!auth!.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (auth!.isDemo) {
    return NextResponse.json({
      totalUsers: 1,
      signalsGenerated: 12,
      journalRecords: getDemoJournal().length,
      usageLogs: [
        {
          action: "scan",
          mode: "practice",
          created_at: new Date().toISOString(),
        },
        {
          action: "scan",
          mode: "live",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      demo: true,
    });
  }

  const admin = createAdminClient();
  const [users, signals, journal, usage] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("signals").select("id", { count: "exact", head: true }),
    admin.from("trade_journal").select("id", { count: "exact", head: true }),
    admin
      .from("usage_logs")
      .select("id,user_id,action,mode,created_at,metadata")
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
