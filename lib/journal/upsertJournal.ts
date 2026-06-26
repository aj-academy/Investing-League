import type { ComputedSignal } from "@/lib/signal-engine/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PLATFORM_JOURNAL_PARTIAL_SAVE } from "@/lib/platform/userCopy";
import { isJpyPair } from "@/lib/utils";

export function pipSize(pair: string): number {
  return isJpyPair(pair) ? 0.01 : 0.0001;
}

export function computePendingDriftPips(
  signalPrice: number,
  platformOpenQuote: number,
  pair: string,
): number {
  if (!signalPrice || !platformOpenQuote) return 0;
  const pip = pipSize(pair);
  return Math.abs(platformOpenQuote - signalPrice) / pip;
}

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
    entry_method: sig.entryMethod ?? null,
    signal_detected_time: sig.signalDetectedAt ?? new Date().toISOString(),
    planned_entry_time: sig.entryTime,
    signal_price: parseFloat(sig.price),
    v10_layer: sig.v10Layer ?? null,
    v10_timing_status: sig.v10TimingStatus ?? null,
    v10_strategy_type: sig.v10StrategyType ?? null,
    v10_blockers: sig.v10Blockers?.join(" · ") || null,
  };
}

function isSchemaColumnError(message: string) {
  return /column|schema cache|does not exist/i.test(message);
}

/** Upsert journal row — retries without V9/V10 columns if migration not applied yet. */
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

  const v9Only = buildJournalRow(userId, signalId, sig, { extended: true });
  const v9Fields = v9Only as Record<string, unknown>;
  delete v9Fields.entry_method;
  delete v9Fields.signal_detected_time;
  delete v9Fields.planned_entry_time;
  delete v9Fields.signal_price;
  delete v9Fields.v10_layer;
  delete v9Fields.v10_timing_status;
  delete v9Fields.v10_strategy_type;
  delete v9Fields.v10_blockers;

  const retryV9 = await writer.from("trade_journal").upsert(v9Fields, {
    onConflict: "user_id,signal_uid",
  });
  if (!retryV9.error) {
    return { error: null, usedFallback: true, warning: PLATFORM_JOURNAL_PARTIAL_SAVE };
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
    warning: PLATFORM_JOURNAL_PARTIAL_SAVE,
  };
}
