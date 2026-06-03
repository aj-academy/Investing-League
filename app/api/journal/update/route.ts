import { requireApiAuth } from "@/lib/auth/apiAuth";
import { calculateEntryDrift } from "@/lib/journal/entryDrift";
import { fetchJournalRowForUser, saveJournalRowForUser } from "@/lib/journal/journalAccess";
import { calculateResult } from "@/lib/journal/resultCalculator";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const journalId = body.journalId as string;
    const signalUid = (body.signalUid as string | undefined) ?? null;
    if (!journalId) {
      return NextResponse.json({ error: "journalId required" }, { status: 400 });
    }

    const row = await fetchJournalRowForUser(auth!.user.id, journalId, signalUid);
    if (!row) {
      return NextResponse.json({ error: "Journal record not found" }, { status: 404 });
    }

    const opening =
      body.openingQuote !== undefined
        ? body.openingQuote === "" || body.openingQuote === null
          ? null
          : Number(body.openingQuote)
        : body.olympOpeningQuote !== undefined
          ? body.olympOpeningQuote === "" || body.olympOpeningQuote === null
            ? null
            : Number(body.olympOpeningQuote)
          : row.olymp_opening_quote;

    const closing =
      body.closingQuote !== undefined
        ? body.closingQuote === "" || body.closingQuote === null
          ? null
          : Number(body.closingQuote)
        : body.olympClosingQuote !== undefined
          ? body.olympClosingQuote === "" || body.olympClosingQuote === null
            ? null
            : Number(body.olympClosingQuote)
          : row.olymp_closing_quote;

    const openTime =
      body.openTime !== undefined
        ? body.openTime === "" || body.openTime === null
          ? null
          : String(body.openTime)
        : row.olymp_open_time;

    const { drift, status } = calculateEntryDrift(
      row.pair,
      row.signal_entry_price,
      opening,
    );

    let result = row.result as string;
    let resultSource = row.result_source as string;

    if (body.result !== undefined && body.result !== null) {
      result = String(body.result);
      resultSource = "Manual";
    } else if (opening !== null && closing !== null) {
      result = calculateResult(row.direction as "CALL" | "PUT", opening, closing);
      resultSource = "Auto";
    }

    const tradeId =
      body.tradeId !== undefined
        ? body.tradeId === "" || body.tradeId === null
          ? null
          : String(body.tradeId)
        : row.olymp_trade_id;

    const { row: updated, error: updateError } = await saveJournalRowForUser(
      auth!.user.id,
      row.id,
      {
        olymp_open_time: openTime,
        olymp_opening_quote: opening,
        olymp_closing_quote: closing,
        olymp_trade_id: tradeId,
        loss_reason: body.lossReason ?? row.loss_reason,
        entry_drift: drift,
        entry_status: status,
        result,
        result_source: resultSource,
        marked_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    );

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError || "Update failed" },
        { status: updateError === "Journal record not found" ? 404 : 500 },
      );
    }

    return NextResponse.json({ row: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
