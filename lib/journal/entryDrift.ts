import { isJpyPair } from "@/lib/utils";

export type EntryStatus = "Valid Entry" | "Risky Entry" | "Invalid Entry" | "Pending";

const VALID_DRIFT_PIPS = 1.5;
const RISKY_DRIFT_PIPS = 3.0;

function pipSize(pair: string) {
  return isJpyPair(pair) ? 0.01 : 0.0001;
}

export function calculateEntryDrift(
  pair: string,
  signalEntry: number | null,
  olympOpening: number | null
): { drift: number | null; status: EntryStatus } {
  if (
    signalEntry === null ||
    olympOpening === null ||
    !Number.isFinite(signalEntry) ||
    !Number.isFinite(olympOpening)
  ) {
    return { drift: null, status: "Pending" };
  }

  const pips = Math.abs(olympOpening - signalEntry) / pipSize(pair);
  if (pips > RISKY_DRIFT_PIPS) {
    return { drift: Number(pips.toFixed(2)), status: "Invalid Entry" };
  }
  if (pips > VALID_DRIFT_PIPS) {
    return { drift: Number(pips.toFixed(2)), status: "Risky Entry" };
  }
  return { drift: Number(pips.toFixed(2)), status: "Valid Entry" };
}
