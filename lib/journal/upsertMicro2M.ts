import type { SupabaseClient } from "@supabase/supabase-js";
import type { Micro2MSignal } from "@/lib/signal-engine/micro2m/types";
import { liveFacingMicroLabel } from "@/lib/signal-engine/micro2m/labels";

export function shouldJournal2MMicroSignal(signal: Micro2MSignal): boolean {
  return (
    signal.microPermission === "2M_MICRO_TRADE" ||
    signal.microPermission === "2M_STRONG_MICRO"
  );
}

export type UpsertMicro2MInput = {
  userId: string;
  signal: Micro2MSignal;
  livePresentation?: boolean;
  scanMode?: "practice" | "live";
  platformOpenQuote?: number | null;
  platformCloseQuote?: number | null;
  result?: "Pending" | "Win" | "Loss" | "Refund";
  notes?: string | null;
};

/** Journal 2M takeable trades — never counted in V9 LIVE win rate. */
export async function upsertMicro2MJournalRow(
  writer: SupabaseClient,
  input: UpsertMicro2MInput,
) {
  const { userId, signal, livePresentation = false } = input;
  const label = liveFacingMicroLabel(signal.microPermission, livePresentation);
  const signalUid =
    signal.sourceSignalUid ||
    signal.id ||
    `2m_${signal.pair}_${signal.direction}_${Date.now()}`;

  const result = input.result ?? "Pending";

  const row: Record<string, unknown> = {
    user_id: userId,
    signal_id: null,
    signal_uid: signalUid.startsWith("2m_") ? signalUid : `2m_${signalUid}`,
    pair: signal.pair,
    timeframe: signal.sourceTf || "2min",
    direction: signal.direction,
    grade: signal.grade ?? null,
    confidence: signal.conf ?? signal.microReadiness ?? null,
    score: signal.score ?? null,
    signal_type: label,
    signal_reason: signal.microReason || "2M direction candidate — 2-minute expiry only",
    trade_eligible: false,
    signal_entry_time: signal.entryTime ?? null,
    signal_entry_price:
      input.platformOpenQuote != null
        ? Number(input.platformOpenQuote)
        : signal.price != null
          ? parseFloat(String(signal.price))
          : null,
    expiry_time: signal.expTime ?? null,
    expiry_minutes: 2,
    result,
    result_source: result === "Pending" ? "Unverified" : "Manual",
    entry_status: "Pending",
    olymp_opening_quote:
      input.platformOpenQuote != null ? Number(input.platformOpenQuote) : null,
    olymp_closing_quote:
      input.platformCloseQuote != null ? Number(input.platformCloseQuote) : null,
    entry_method: "manual_2m",
    strategy_type: "2M_MICRO",
    micro_permission: signal.microPermission,
    micro_label: label,
    micro_readiness: signal.microReadiness,
    source_layer: signal.sourceLayer ?? null,
    v9_layer: signal.sourceLayer ?? null,
    v9_readiness: signal.microReadiness,
    notes: input.notes ?? null,
    scan_mode: input.scanMode ?? "practice",
  };

  const { error } = await writer.from("trade_journal").upsert(row, {
    onConflict: "user_id,signal_uid",
  });

  if (!error) return { error: null as string | null, signalUid: row.signal_uid as string };

  if (/column|schema cache|does not exist/i.test(error.message)) {
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
      return { error: retry.error.message, signalUid: row.signal_uid as string };
    }
    return {
      error: null as string | null,
      signalUid: row.signal_uid as string,
      warning: "Saved without optional 2M columns",
    };
  }

  return { error: error.message, signalUid: row.signal_uid as string };
}
