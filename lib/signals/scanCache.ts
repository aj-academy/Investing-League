import type { ComputedSignal } from "@/lib/signal-engine/types";
import type { TickerItem } from "@/lib/market/tickerService";

const KEY = "til_last_scan_v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type CachedScanPayload = {
  ts: number;
  scanSessionId?: string;
  signals: ComputedSignal[];
  ticker?: TickerItem[];
};

export function saveScanToSessionCache(payload: CachedScanPayload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...payload, ts: Date.now() }));
  } catch {
    /* quota / private mode */
  }
}

export function readScanFromSessionCache(): CachedScanPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedScanPayload;
    if (!parsed?.signals?.length) return null;
    if (Date.now() - (parsed.ts || 0) > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
