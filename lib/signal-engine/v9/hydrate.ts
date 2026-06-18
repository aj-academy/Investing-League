import type { ComputedSignal } from "../types";
import { applyV9Layers } from "./classify";
import { buildV9ScanMeta } from "./scanMeta";
import type { V9ScanMeta } from "./types";

/** Ensure V9 layers + scan meta exist (e.g. after cache / latest-scan reload). */
export function hydrateV9ScanResult(
  signals: ComputedSignal[],
  options?: {
    v9?: V9ScanMeta | null;
    apiCalls?: number;
    marketErrors?: string[];
  },
): { signals: ComputedSignal[]; v9: V9ScanMeta } {
  const layered = signals.some((s) => s.v9Layer) ? signals : applyV9Layers(signals);
  const v9 =
    options?.v9 ??
    buildV9ScanMeta(layered, {
      apiCalls: options?.apiCalls ?? 0,
      marketErrors: options?.marketErrors,
    });
  return { signals: layered, v9 };
}
