import type { ComputedSignal } from "@/lib/signal-engine/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function buildJournalRow(
  userId: string,
  signalId: string | null,
  sig: ComputedSignal,
  options?: { extended?: boolean },
) {
  const core = {
    user_id: userId,
    signal_id: signalId,
    signal_uid: sig.signalUid,
    pair: sig.pair,
    timeframe: sig.tf,
    direction: sig.direction,
    grade: sig.grade,
    confidence: sig.conf,
    score: sig.score,
    signal_type: sig.signalType,
    signal_reason: sig.signalReason,
    trade_eligible: sig.tradeEligible,
    signal_entry_time: sig.entryTime,
    signal_entry_price: parseFloat(sig.price),
    expiry_time: sig.expTime,
    expiry_minutes: sig.expMin,
    result: "Pending",
    result_source: "Unverified",
    entry_status: "Pending",
  };

  if (!options?.extended) return core;

  return {
    ...core,
    scan_mode: sig.mode,
    v9_layer: sig.v9Layer ?? null,
    v9_readiness: sig.v9Readiness ?? null,
  };
}

function isSchemaColumnError(message: string) {
  return /column|schema cache|does not exist/i.test(message);
}

/** Upsert journal row — retries without V9/CPP columns if migration not applied yet. */
export async function upsertTradeJournalRow(
  writer: SupabaseClient,
  userId: string,
  signalId: string | null,
  sig: ComputedSignal,
) {
  const extended = buildJournalRow(userId, signalId, sig, { extended: true });
  const { error } = await writer.from("trade_journal").upsert(extended, {
    onConflict: "user_id,signal_uid",
  });

  if (!error) return { error: null, usedFallback: false };

  if (!isSchemaColumnError(error.message)) {
    return { error: error.message, usedFallback: false };
  }

  const core = buildJournalRow(userId, signalId, sig, { extended: false });
  const retry = await writer.from("trade_journal").upsert(core, {
    onConflict: "user_id,signal_uid",
  });

  if (retry.error) {
    return { error: retry.error.message, usedFallback: true };
  }

  return {
    error: null,
    usedFallback: true,
    warning:
      "Journal saved without V9/capital columns — run capital_protection_plan.sql and v9_signal_layers.sql in Supabase.",
  };
}
