import type { ComputedSignal } from "@/lib/signal-engine/types";
import { applyV9Layers } from "./classify";
import { buildV10ScanMeta } from "../v10/scanMeta";
import { applyV10Layers } from "../v10/validate";
import type { EntryMethod } from "../v10/types";
import type { V9ScanMeta } from "./types";

/** Ensure V9/V10 layers + scan meta exist (e.g. after cache / latest-scan reload). */
export function hydrateV9ScanResult(
  signals: ComputedSignal[],
  options?: {
    v9?: V9ScanMeta | null;
    apiCalls?: number;
    marketErrors?: string[];
    entryMethod?: EntryMethod;
  },
): { signals: ComputedSignal[]; v9: V9ScanMeta } {
  const entryMethod = options?.entryMethod ?? "pending_order";
  let layered = signals.some((s) => s.v9Layer) ? signals : applyV9Layers(signals);
  layered = layered.some((s) => s.v10Layer)
    ? layered
    : applyV10Layers(layered, {
        entryMethod,
        htfCandlesByPair: new Map(),
        now: new Date(),
      });
  const v9 =
    options?.v9 ??
    buildV10ScanMeta(layered, {
      apiCalls: options?.apiCalls ?? 0,
      marketErrors: options?.marketErrors,
    });
  return { signals: layered, v9 };
}
