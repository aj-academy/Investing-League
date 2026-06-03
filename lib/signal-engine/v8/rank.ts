import type { ComputedSignal } from "../types";

export function rankV8Signals(a: ComputedSignal, b: ComputedSignal): number {
  const typeScore = (x: ComputedSignal) =>
    x.signalType === "STRONG FINAL"
      ? 5
      : x.signalType === "FINAL TRADE"
        ? 4
        : x.permission === "OBSERVE ONLY"
          ? 2
          : 1;
  return (
    typeScore(b) - typeScore(a) ||
    b.conf - a.conf ||
    b.scoreGap - a.scoreGap ||
    b.score - a.score
  );
}
