import { requireApiAuth } from "@/lib/auth/apiAuth";
import { getDemoJournal, updateDemoJournal } from "@/lib/demo/mockStore";
import { calculateEntryDrift } from "@/lib/journal/entryDrift";
import { calculateResult } from "@/lib/journal/resultCalculator";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const journalId = body.journalId as string;
    if (!journalId) {
      return NextResponse.json({ error: "journalId required" }, { status: 400 });
    }

    if (auth!.isDemo) {
      const existing = getDemoJournal().find((r) => r.id === journalId);
      if (!existing) {
        return NextResponse.json({ error: "Journal record not found" }, { status: 404 });
      }
      const row = existing;

      const opening =
        body.olympOpeningQuote !== undefined
          ? body.olympOpeningQuote === "" || body.olympOpeningQuote === null
            ? null
            : Number(body.olympOpeningQuote)
          : row.olymp_opening_quote;
      const closing =
        body.olympClosingQuote !== undefined
          ? body.olympClosingQuote === "" || body.olympClosingQuote === null
            ? null
            : Number(body.olympClosingQuote)
          : row.olymp_closing_quote;

      const { drift, status } = calculateEntryDrift(
        row.pair,
        row.signal_entry_price,
        opening
      );

      const result =
        opening !== null && closing !== null
          ? calculateResult(row.direction, opening, closing)
          : row.result;

      const updated = updateDemoJournal(journalId, {
        olymp_opening_quote: opening,
        olymp_closing_quote: closing,
        olymp_trade_id: body.olympTradeId ?? row.olymp_trade_id,
        loss_reason: body.lossReason ?? row.loss_reason,
        entry_drift: drift,
        entry_status: status,
        result,
        result_source: opening !== null && closing !== null ? "Auto" : row.result_source,
        marked_time: new Date().toISOString(),
      });

      return NextResponse.json({ row: updated });
    }

    const supabase = await createClient();
    const { data: row, error: fetchError } = await supabase
      .from("trade_journal")
      .select("*")
      .eq("id", journalId)
      .eq("user_id", auth!.user.id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Journal record not found" }, { status: 404 });
    }

    const opening =
      body.olympOpeningQuote !== undefined
        ? body.olympOpeningQuote === "" || body.olympOpeningQuote === null
          ? null
          : Number(body.olympOpeningQuote)
        : row.olymp_opening_quote;
    const closing =
      body.olympClosingQuote !== undefined
        ? body.olympClosingQuote === "" || body.olympClosingQuote === null
          ? null
          : Number(body.olympClosingQuote)
        : row.olymp_closing_quote;

    const { drift, status } = calculateEntryDrift(
      row.pair,
      row.signal_entry_price,
      opening
    );

    const result =
      opening !== null && closing !== null
        ? calculateResult(row.direction as "CALL" | "PUT", opening, closing)
        : row.result;

    const { data: updated, error: updateError } = await supabase
      .from("trade_journal")
      .update({
        olymp_opening_quote: opening,
        olymp_closing_quote: closing,
        olymp_trade_id: body.olympTradeId ?? row.olymp_trade_id,
        loss_reason: body.lossReason ?? row.loss_reason,
        entry_drift: drift,
        entry_status: status,
        result,
        result_source: opening !== null && closing !== null ? "Auto" : row.result_source,
        marked_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", journalId)
      .eq("user_id", auth!.user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ row: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
