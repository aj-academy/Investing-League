import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getDemoJournal } from "@/lib/demo/mockStore";
import { journalToJson } from "@/lib/journal/exportJson";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  if (auth!.isDemo) {
    return new NextResponse(journalToJson(getDemoJournal()), {
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        "Content-Disposition": 'attachment; filename="til_trade_journal.json"',
      },
    });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  let query = supabase
    .from("trade_journal")
    .select("*")
    .eq("user_id", auth!.user.id)
    .order("created_at", { ascending: false });

  const pair = searchParams.get("pair");
  if (pair) query = query.eq("pair", pair);

  const { data: rows } = await query;

  return new NextResponse(journalToJson(rows || []), {
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "Content-Disposition": 'attachment; filename="til_trade_journal.json"',
    },
  });
}
