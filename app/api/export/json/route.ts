import { requireApiAuth } from "@/lib/auth/apiAuth";
import { journalToJson } from "@/lib/journal/exportJson";
import { loadJournalForUser } from "@/lib/journal/loadJournal";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const rows = await loadJournalForUser(auth!.user.id, {
    pair: searchParams.get("pair") || undefined,
    limit: 1000,
  });

  return new NextResponse(journalToJson(rows as unknown as Record<string, unknown>[]), {
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Content-Disposition": 'attachment; filename="til_trade_journal.json"',
    },
  });
}
