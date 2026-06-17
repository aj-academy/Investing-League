import { requireAdminApi } from "@/lib/admin/guard";
import {
  adminJournalToCsv,
  computeAdminJournalSummary,
  computeUserSummaries,
  normalizeAdminJournalRow,
  type AdminJournalFilters,
} from "@/lib/admin/adminJournal";
import { RISK_DISCLAIMER } from "@/lib/risk/capitalProtection";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function matchesSignalTypeFilter(label: string, filter: string): boolean {
  if (!filter) return true;
  return label.toLowerCase() === filter.toLowerCase();
}

export async function GET(request: Request) {
  const { error: adminError } = await requireAdminApi();
  if (adminError) return adminError;

  const url = new URL(request.url);
  const filters: AdminJournalFilters = {
    userName: url.searchParams.get("userName") || undefined,
    email: url.searchParams.get("email") || undefined,
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    pair: url.searchParams.get("pair") || undefined,
    result: url.searchParams.get("result") || undefined,
    signalType: url.searchParams.get("signalType") || undefined,
    mode: url.searchParams.get("mode") || undefined,
    timeframe: url.searchParams.get("timeframe") || undefined,
    plan: url.searchParams.get("plan") || undefined,
    verifiedOnly: url.searchParams.get("verifiedOnly") === "1",
    pendingOnly: url.searchParams.get("pendingOnly") === "1",
  };

  const format = url.searchParams.get("format");

  const admin = createAdminClient();

  let journalQuery = admin
    .from("trade_journal")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (filters.from) journalQuery = journalQuery.gte("created_at", `${filters.from}T00:00:00.000Z`);
  if (filters.to) journalQuery = journalQuery.lte("created_at", `${filters.to}T23:59:59.999Z`);
  if (filters.pair) journalQuery = journalQuery.eq("pair", filters.pair);
  if (filters.result) journalQuery = journalQuery.eq("result", filters.result);
  if (filters.mode) journalQuery = journalQuery.eq("scan_mode", filters.mode);
  if (filters.timeframe) journalQuery = journalQuery.eq("timeframe", filters.timeframe);
  if (filters.pendingOnly) journalQuery = journalQuery.eq("result", "Pending");

  const { data: journalRows, error: journalError } = await journalQuery;
  if (journalError) {
    return NextResponse.json({ error: journalError.message }, { status: 500 });
  }

  const userIds = [...new Set((journalRows || []).map((r) => r.user_id as string))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, plan")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id as string, p]),
  );

  let rows = (journalRows || []).map((row) =>
    normalizeAdminJournalRow(
      row as Record<string, unknown>,
      profileMap.get(row.user_id as string) ?? null,
    ),
  );

  if (filters.userName) {
    const q = filters.userName.toLowerCase();
    rows = rows.filter((r) => (r.user_name || "").toLowerCase().includes(q));
  }
  if (filters.email) {
    const q = filters.email.toLowerCase();
    rows = rows.filter((r) => (r.user_email || "").toLowerCase().includes(q));
  }
  if (filters.plan) {
    rows = rows.filter((r) => (r.user_plan || "").toLowerCase() === filters.plan!.toLowerCase());
  }
  if (filters.signalType) {
    rows = rows.filter((r) => matchesSignalTypeFilter(r.signal_type_label, filters.signalType!));
  }
  if (filters.verifiedOnly) {
    rows = rows.filter((r) => r.verified);
  }

  const summary = computeAdminJournalSummary(rows);
  const userSummaries = computeUserSummaries(rows);

  if (format === "csv") {
    const csv = adminJournalToCsv(rows);
    const disclaimer = `# ${RISK_DISCLAIMER}`;
    const body = `${disclaimer}\n${csv}`;
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=til_admin_journal.csv",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    filters,
    summary,
    userSummaries,
    rows,
  });
}
