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

/**
 * Build journal row in the same core shape as V9 (buildJournalRow),
 * with 2M tags so it appears in Journal and is excluded from V9 LIVE WR.
 */
export function buildMicro2MJournalRow(
  userId: string,
  signal: Micro2MSignal,
  options?: { livePresentation?: boolean; scanMode?: "practice" | "live" },
) {
  const live = Boolean(options?.livePresentation);
  const label = liveFacingMicroLabel(signal.microPermission, live);
  const price = cleanNum(signal.price);

  const core = {
    user_id: userId,
    signal_id: null as string | null,
    signal_uid: microSignalUid(signal),
    pair: signal.pair,
    timeframe: "2min",
    direction: signal.direction,
    grade: signal.grade ?? null,
    confidence: signal.microReadiness ?? signal.conf ?? null,
    score: signal.score ?? null,
    signal_type: label,
    signal_reason: signal.microReason || "2-minute takeable setup — auto-saved on scan",
    // true so Journal "Trade allowed" filter matches; V9 WR still excludes via strategy_type / entry_method
    trade_eligible: true,
    signal_entry_time: signal.entryTime ?? null,
    signal_entry_price: price,
    expiry_time: signal.expTime ?? null,
    expiry_minutes: 2,
    result: "Pending",
    result_source: "Unverified",
    entry_status: "Pending",
  };

  const extended = {
    ...core,
    scan_mode: options?.scanMode ?? "practice",
    v9_layer: signal.sourceLayer ?? null,
    v9_readiness: signal.microReadiness ?? null,
    entry_method: "manual_2m" as const,
    signal_detected_time: new Date().toISOString(),
    planned_entry_time: signal.entryTime ?? null,
    signal_price: price,
    strategy_type: "2M_MICRO",
    micro_permission: signal.microPermission,
    micro_label: label,
    micro_readiness: signal.microReadiness,
    source_layer: signal.sourceLayer ?? null,
  };

  return { core, extended, signalUid: core.signal_uid };
}

const EXTENDED_OPTIONAL = [
  "strategy_type",
  "micro_permission",
  "micro_label",
  "micro_readiness",
  "source_layer",
  "entry_method",
  "signal_detected_time",
  "planned_entry_time",
  "signal_price",
  "v9_layer",
  "v9_readiness",
  "scan_mode",
  "expiry_minutes",
] as const;

/** Auto-save 2M takeable trades on scan — same journal flow as V9 (no card form). */
export async function upsertMicro2MJournalRow(
  writer: SupabaseClient,
  input: UpsertMicro2MInput,
) {
  const { userId, signal, livePresentation = false, scanMode } = input;
  const built = buildMicro2MJournalRow(userId, signal, { livePresentation, scanMode });

  let attempt: Record<string, unknown> = { ...built.extended };
  let lastError: string | null = null;

  for (let i = 0; i < EXTENDED_OPTIONAL.length + 1; i++) {
    const { error } = await writer.from("trade_journal").upsert(attempt, {
      onConflict: "user_id,signal_uid",
    });

    if (!error) {
      return {
        error: null as string | null,
        signalUid: built.signalUid,
        warning:
          i > 0
            ? "Saved with partial columns — apply micro2m_journal_fields migration for full 2M fields."
            : undefined,
      };
    }

    lastError = error.message;
    if (!/column|schema cache|does not exist/i.test(error.message)) {
      break;
    }

    const next = { ...attempt };
    const col = EXTENDED_OPTIONAL[i];
    if (col) delete next[col];
    attempt = next;
  }

  // Core-only retry (mirrors V9 upsertTradeJournalRow fallback)
  const { error: coreErr } = await writer.from("trade_journal").upsert(built.core, {
    onConflict: "user_id,signal_uid",
  });
  if (!coreErr) {
    return {
      error: null as string | null,
      signalUid: built.signalUid,
      warning: "Saved core journal fields only.",
    };
  }

  return { error: lastError || coreErr.message, signalUid: built.signalUid };
}
