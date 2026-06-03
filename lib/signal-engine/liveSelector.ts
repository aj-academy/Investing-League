import { usdLinked } from "./correlation";
import { applyPermission } from "./permission";
import type { ComputedSignal } from "./types";

export function isEligible(type?: string) {
  return type === "FINAL TRADE" || type === "STRONG FINAL";
}

export function rankSignal(s: ComputedSignal) {
  let r = 0;
  r += s.signalType === "STRONG FINAL" ? 100 : s.signalType === "FINAL TRADE" ? 70 : 0;
  r += s.grade === "A+" ? 25 : s.grade === "A" ? 15 : 0;
  r += Number(s.conf || 0) * 0.6;
  r += Number(s.scoreGap || 0) * 1.2;
  r += Number(s.adx || 0) * 0.7;
  r += Number(s.candleBodyRatio || 0) * 0.25;
  if (s.volOk) r += 8;
  if (s.sidewaysMarket) r -= 15;
  if (s.bigCandle) r -= 18;
  if (
    (s.direction === "CALL" && s.overExtendedBull) ||
    (s.direction === "PUT" && s.overExtendedBear)
  )
    r -= 25;
  return Math.round(r);
}

export function applyLiveSelector(signals: ComputedSignal[]) {
  const eligible = signals.filter((s) => isEligible(s.signalType));
  if (!eligible.length) return signals;

  eligible.forEach((s) => {
    s.liveRank = rankSignal(s);
  });
  eligible.sort((a, b) => (b.liveRank || 0) - (a.liveRank || 0));
  const top = eligible[0];

  signals.forEach((s) => {
    if (s === top) {
      s.signalReason =
        "LIVE MODE SELECTED: best ranked signal in this scan. " + (s.signalReason || "");
      return;
    }
    if (isEligible(s.signalType)) {
      if (usdLinked(s.pair) && usdLinked(top.pair)) {
        s.signalType = "CORRELATION RISK";
        s.signalReason =
          "Live Mode: another stronger USD-linked signal was selected. Do not take multiple correlated trades in the same expiry window.";
      } else {
        s.signalType = "WATCH ONLY";
        s.signalReason =
          "Live Mode: lower-ranked setup. Only the best signal is trade eligible.";
      }
      s.tradeEligible = false;
      applyPermission(s);
    }
  });

  return signals.map(applyPermission);
}
