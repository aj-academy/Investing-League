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

function cleanNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function microSignalUid(signal: Micro2MSignal): string {
  const raw =
    signal.sourceSignalUid ||
    signal.id ||
    `2m_${signal.pair}_${signal.direction}_${Date.now()}`;
  return raw.startsWith("2m_") ? raw : `2m_${raw}`;
}

const OPTIONAL_COLUMNS = [
  "strategy_type",
  "micro_permission",
  "micro_label",
  "micro_readiness",
  "source_layer",
  "notes",
  "entry_method",
  "v9_layer",
  "v9_readiness",
  "scan_mode",
  "olymp_opening_quote",
  "olymp_closing_quote",
  "expiry_minutes",
] as const;

/** Journal 2M takeable trades — never counted in V9 LIVE win rate. */
export async function upsertMicro2MJournalRow(
  writer: SupabaseClient,
  input: UpsertMicro2MInput,
) {
  const { userId, signal, livePresentation = false } = input;
  const label = liveFacingMicroLabel(signal.microPermission, livePresentation);
  const signalUid = microSignalUid(signal);
  const result = input.result ?? "Pending";
  const openQ = cleanNum(input.platformOpenQuote);
  const closeQ = cleanNum(input.platformCloseQuote);
  const priceFromSignal =
    signal.price != null ? cleanNum(signal.price) : null;

  const row: Record<string, unknown> = {
    user_id: userId,
    signal_id: null,
    signal_uid: signalUid,
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
    signal_entry_price: openQ ?? priceFromSignal,
    expiry_time: signal.expTime ?? null,
    expiry_minutes: 2,
    result,
    result_source: result === "Pending" ? "Unverified" : "Manual",
    entry_status: "Pending",
    olymp_opening_quote: openQ,
    olymp_closing_quote: closeQ,
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

  let attempt: Record<string, unknown> = { ...row };
  let lastError: string | null = null;

  for (let i = 0; i < OPTIONAL_COLUMNS.length + 1; i++) {
    const { error } = await writer.from("trade_journal").upsert(attempt, {
      onConflict: "user_id,signal_uid",
    });

    if (!error) {
      return {
        error: null as string | null,
        signalUid,
        warning: i > 0 ? "Saved with partial columns (apply micro2m_journal_fields migration)." : undefined,
      };
    }

    lastError = error.message;
    if (!/column|schema cache|does not exist/i.test(error.message)) {
      break;
    }

    const next = { ...attempt };
    const col = OPTIONAL_COLUMNS[i];
    if (col) delete next[col];
    attempt = next;
  }

  // Last resort: update existing row by signal_uid (covers insert-RLS blocks)
  const { data: existing } = await writer
    .from("trade_journal")
    .select("id")
    .eq("user_id", userId)
    .eq("signal_uid", signalUid)
    .maybeSingle();

  if (existing?.id) {
    const patch: Record<string, unknown> = {
      result,
      result_source: result === "Pending" ? "Unverified" : "Manual",
      olymp_opening_quote: openQ,
      olymp_closing_quote: closeQ,
      signal_entry_price: openQ ?? priceFromSignal,
      notes: input.notes ?? null,
    };
    const { error: updErr } = await writer
      .from("trade_journal")
      .update(patch)
      .eq("id", existing.id);
    if (!updErr) {
      return { error: null as string | null, signalUid, warning: "Updated existing 2M journal row." };
    }
    lastError = updErr.message;
  }

  return { error: lastError || "Failed to save 2M journal", signalUid };
}
