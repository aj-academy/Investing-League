import { requireApiAuth } from "@/lib/auth/apiAuth";
import { journalToCsv } from "@/lib/journal/exportCsv";
import { loadJournalForUser } from "@/lib/journal/loadJournal";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const rows = await loadJournalForUser(auth!.user.id, {
    pair: searchParams.get("pair") || undefined,
    result: searchParams.get("result") || undefined,
    limit: 1000,
  });
  const csv = journalToCsv(rows as unknown as Record<string, unknown>[]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="til_trade_journal.csv"',
    },
  });
}
