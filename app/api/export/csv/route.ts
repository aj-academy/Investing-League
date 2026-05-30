import { requireApiAuth } from "@/lib/auth/apiAuth";
import { journalToCsv } from "@/lib/journal/exportCsv";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { auth, error } = await requireApiAuth();
  if (error) return error;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  let query = supabase
    .from("trade_journal")
    .select("*")
    .eq("user_id", auth!.user.id)
    .order("created_at", { ascending: false });

  const pair = searchParams.get("pair");
  const result = searchParams.get("result");
  if (pair) query = query.eq("pair", pair);
  if (result) query = query.eq("result", result);

  const { data: rows } = await query;
  const csv = journalToCsv(rows || []);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="til_trade_journal.csv"',
    },
  });
}
