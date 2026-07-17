import { requireApiAuth } from "@/lib/auth/apiAuth";
import { upsertMicro2MJournalRow } from "@/lib/journal/upsertMicro2M";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Micro2MSignal } from "@/lib/signal-engine/micro2m/types";
import { NextResponse } from "next/server";

/**
 * Create or update a 2M Micro / 2M LIVE journal row.
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

    const permission =
      body.microPermission === "2M_STRONG_MICRO" ||
      body.microPermission === "2M_MICRO_TRADE" ||
      body.microPermission === "2M_WATCH" ||
      body.microPermission === "2M_AVOID"
        ? body.microPermission
        : "2M_MICRO_TRADE";

    const signal: Micro2MSignal = {
      id: String(body.signalUid || body.sourceSignalUid || `2m_${pair}_${direction}`),
      pair,
      direction,
      sourceTf: String(body.sourceTf || "2min"),
      sourceLayer: body.sourceLayer ?? null,
      grade: String(body.grade || "B"),
      conf: Number(body.conf || body.microReadiness || 0),
      score: Number(body.score || 0),
      scoreGap: 0,
      microReadiness: Number(body.microReadiness || 0),
      microPermission: permission,
      microLabel: "2M MICRO TRADE",
      microReason: String(body.microReason || ""),
      microAction: "",
      candleAligned: true,
      candleBodyRatio: 0,
      isDoji: false,
      oneMinuteStatus: "UNAVAILABLE",
      oneMinuteNote: "",
      expiryLabel: "2 minutes",
      strategyType: "2M_MICRO",
      entryMethod: "manual_2m",
      isBest: false,
      warnings: [],
      sourceSignalUid: body.sourceSignalUid || body.signalUid,
    };

    const admin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
    const supabase = await createClient();
    const writer = admin ?? supabase;

    const result =
      body.result === "Win" || body.result === "Loss" || body.result === "Refund"
        ? body.result
        : "Pending";

    const saved = await upsertMicro2MJournalRow(writer, {
      userId: auth!.user.id,
      signal,
      livePresentation: Boolean(body.livePresentation),
      scanMode: body.scanMode === "live" ? "live" : "practice",
      platformOpenQuote: body.platformOpenQuote != null ? Number(body.platformOpenQuote) : null,
      platformCloseQuote: body.platformCloseQuote != null ? Number(body.platformCloseQuote) : null,
      result,
      notes: body.notes != null ? String(body.notes) : null,
    });

    if (saved.error) {
      return NextResponse.json({ error: saved.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      signalUid: saved.signalUid,
      warning: saved.warning,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save 2M journal" },
      { status: 500 },
    );
  }
}
