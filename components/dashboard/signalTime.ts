import { formatSignalTime, resolveTimeZone } from "@/lib/datetime";
import type { ComputedSignal } from "@/lib/signal-engine/types";

export function displayEntryTime(sig: ComputedSignal, timeZone?: string): string {
  const tz = resolveTimeZone(timeZone);
  if (sig.entryAtIso) {
    return formatSignalTime(new Date(sig.entryAtIso), tz);
  }
  return sig.entryTime;
}

export function displayExpTime(sig: ComputedSignal, timeZone?: string): string {
  const tz = resolveTimeZone(timeZone);
  if (sig.expAtIso) {
    return formatSignalTime(new Date(sig.expAtIso), tz);
  }
  return sig.expTime;
}
