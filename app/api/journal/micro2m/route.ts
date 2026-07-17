import { requireApiAuth } from "@/lib/auth/apiAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Create or update a 2M Micro journal row.
 * Never counted in V9 LIVE win rate (strategy_type=2M_MICRO, entry_method=manual_2m).
 */
export async function POST(request: Request) {
  try {
    const { auth, error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const pair = String(body.pair || "").trim();
    const direction = body.direction === "PUT" ? "PUT" : body.direction === "CALL" ? "CALL" : null;
    if (!pair || !direction) {
      return NextResponse.json({ error: "pair and direction required" }, { status: 400 });
    }

    const signalUid =
      String(body.signalUid || body.sourceSignalUid || "").trim() ||
      `2m_${pair}_${direction}_${Date.now()}`;

    const result =
      body.result === "Win" || body.result === "Loss" || body.result === "Refund"
        ? body.result
        : "Pending";

    const row: Record<string, unknown> = {
      user_id: auth!.user.id,
      signal_id: null,
      signal_uid: signalUid,
      pair,
      timeframe: String(body.sourceTf || "5min"),
      direction,
      grade: body.grade ?? null,
      confidence: body.conf ?? body.microReadiness ?? null,
      score: body.score ?? null,
      signal_type: String(body.microLabel || "2M MICRO TRADE"),
      signal_reason: String(body.microReason || "2M Micro direction candidate"),
      trade_eligible: false,
      signal_entry_time: body.entryTime ?? null,
      signal_entry_price: body.platformOpenQuote != null ? Number(body.platformOpenQuote) : null,
      expiry_time: null,
      expiry_minutes: 2,
      result,
      result_source: result === "Pending" ? "Unverified" : "Manual",
      entry_status: "Pending",
      olymp_opening_quote:
        body.platformOpenQuote != null && body.platformOpenQuote !== ""
          ? Number(body.platformOpenQuote)
          : null,
      olymp_closing_quote:
        body.platformCloseQuote != null && body.platformCloseQuote !== ""
          ? Number(body.platformCloseQuote)
          : null,
      entry_method: "manual_2m",
      strategy_type: "2M_MICRO",
      micro_permission: body.microPermission ?? null,
      micro_label: body.microLabel ?? null,
      micro_readiness: body.microReadiness ?? null,
      source_layer: body.sourceLayer ?? null,
      v9_layer: body.sourceLayer ?? null,
      v9_readiness: body.microReadiness ?? null,
      notes: body.notes != null ? String(body.notes) : null,
      scan_mode: "practice",
    };

    const admin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
    const supabase = await createClient();
    const writer = admin ?? supabase;

    const { error: upsertError } = await writer.from("trade_journal").upsert(row, {
      onConflict: "user_id,signal_uid",
    });

    if (!upsertError) {
      return NextResponse.json({ ok: true, signalUid });
    }

    // Retry without optional micro columns if migration not applied
    if (/column|schema cache|does not exist/i.test(upsertError.message)) {
      const fallback = { ...row };
      delete fallback.strategy_type;
      delete fallback.micro_permission;
      delete fallback.micro_label;
      delete fallback.micro_readiness;
      delete fallback.source_layer;
      delete fallback.notes;
      delete fallback.entry_method;
      delete fallback.v9_layer;
      delete fallback.v9_readiness;
      delete fallback.scan_mode;

      const retry = await writer.from("trade_journal").upsert(fallback, {
        onConflict: "user_id,signal_uid",
      });
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      return NextResponse.json({
        ok: true,
        signalUid,
        warning: "Saved without optional 2M columns — apply micro2m_journal_fields migration.",
      });
    }

    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save 2M journal" },
      { status: 500 },
    );
  }
}
