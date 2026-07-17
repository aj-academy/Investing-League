import { MICRO_2M_CONFIG } from "./config";
import type { Micro2MPermission, Micro2MSignal } from "./types";

const PERM_RANK: Record<Micro2MPermission, number> = {
  "2M_STRONG_MICRO": 0,
  "2M_MICRO_TRADE": 1,
  "2M_WATCH": 2,
  "2M_AVOID": 3,
};

/** Rank and return top N 2M Micro cards (never empty if candidates exist). */
export function rank2MMicroSignals(signals: Micro2MSignal[]): Micro2MSignal[] {
  const sorted = [...signals].sort((a, b) => {
    const pr = PERM_RANK[a.microPermission] - PERM_RANK[b.microPermission];
    if (pr !== 0) return pr;
    if (b.microReadiness !== a.microReadiness) return b.microReadiness - a.microReadiness;
    if (b.conf !== a.conf) return b.conf - a.conf;
    if (b.scoreGap !== a.scoreGap) return b.scoreGap - a.scoreGap;
    if (b.candleBodyRatio !== a.candleBodyRatio) return b.candleBodyRatio - a.candleBodyRatio;

    const aCaution = MICRO_2M_CONFIG.cautionPairs.includes(a.pair) ? 1 : 0;
    const bCaution = MICRO_2M_CONFIG.cautionPairs.includes(b.pair) ? 1 : 0;
    if (aCaution !== bCaution) {
      // Prefer non-caution unless readiness is very strong
      if (a.microReadiness >= MICRO_2M_CONFIG.strongTradeReadiness && aCaution) return -1;
      if (b.microReadiness >= MICRO_2M_CONFIG.strongTradeReadiness && bCaution) return 1;
      return aCaution - bCaution;
    }
    return a.pair.localeCompare(b.pair);
  });

  const top = sorted.slice(0, MICRO_2M_CONFIG.maxSignalsToShow).map((s, i) => ({
    ...s,
    isBest: i === 0,
  }));

  return top;
}
