import type { ComputedSignal } from "../types";
import { isWeekendMarket } from "../session";
import type { V9RadarItem, V9ScanMeta, V9WhyItem } from "./types";

function rankForRadar(a: ComputedSignal, b: ComputedSignal) {
  const layerOrder = { LIVE: 4, PRACTICE: 3, RADAR: 2, REJECTED: 1 };
  const la = layerOrder[a.v9Layer || "RADAR"];
  const lb = layerOrder[b.v9Layer || "RADAR"];
  return lb - la || (b.v9Readiness || 0) - (a.v9Readiness || 0) || b.conf - a.conf;
}

export function buildV9ScanMeta(
  signals: ComputedSignal[],
  options: { apiCalls: number; marketErrors?: string[] },
): V9ScanMeta {
  const weekendBlocked = isWeekendMarket();
  const liveCount = signals.filter((s) => s.v9Layer === "LIVE").length;
  const practiceCount = signals.filter((s) => s.v9Layer === "PRACTICE").length;
  const radarCount = signals.filter((s) => s.v9Layer === "RADAR").length;
  const rejectedCount = signals.filter((s) => s.v9Layer === "REJECTED").length;
  const protectedRiskyCount = signals.filter(
    (s) =>
      s.v9Layer === "REJECTED" ||
      s.permission === "DO NOT TRADE" ||
      (s.blockers?.length ?? 0) > 0,
  ).length;

  const sorted = [...signals].sort(rankForRadar);
  const best = sorted[0];

  let headline = "No Trade Allowed Yet";
  let subline =
    "No trade is also a trading decision. The system protects users by rejecting low-quality setups.";
  let status: V9ScanMeta["status"] = "EMPTY";

  if (options.marketErrors?.length && !signals.length) {
    headline = "No Market Data Confirmed";
    subline = "Data provider issues found. Wait and retry after rate-limit cooldown.";
    status = "DATA";
  } else if (!signals.length) {
    status = "EMPTY";
  } else if (liveCount > 0) {
    headline = `${liveCount} Live Trade Permission${liveCount > 1 ? "s" : ""}`;
    subline = `Best setup: ${best.pair} ${best.direction}. Trade only with risk rules and near candle open.`;
    status = "LIVE";
  } else if (practiceCount > 0) {
    headline = `No Trade Allowed Yet · ${practiceCount} Practice Setup${practiceCount > 1 ? "s" : ""}`;
    subline = `Market has direction, but live permission is protected. Best practice setup: ${best.pair} ${best.direction}.`;
    status = "PRACTICE";
  } else {
    subline = `Market checked successfully. Best radar setup: ${best.pair} ${best.direction} at ${best.v9Readiness}% ready.`;
    status = "RADAR";
  }

  if (weekendBlocked) {
    subline = `Weekend / Thin Market — Live trading blocked. ${subline}`;
  }

  const radarTop: V9RadarItem[] = sorted.slice(0, 3).map((s) => ({
    pair: s.pair,
    direction: s.direction,
    tf: s.tf,
    readiness: s.v9Readiness || 0,
    blocker: s.v9Blocker || s.signalReason || "Setup forming",
    nextCondition: s.v9NextCondition || "Waiting for confirmation",
    v9Layer: s.v9Layer || "RADAR",
    grade: s.grade,
    conf: s.conf,
  }));

  const whyNoSignal: V9WhyItem[] = signals
    .filter((s) => s.v9Layer !== "LIVE")
    .sort((a, b) => (b.v9Readiness || 0) - (a.v9Readiness || 0))
    .slice(0, 8)
    .map((s) => ({
      pair: s.pair,
      direction: s.direction,
      reason: s.v9Blocker || s.signalReason || "Conditions not ready for live permission",
    }));

  return {
    headline,
    subline,
    status,
    liveCount,
    practiceCount,
    radarCount,
    rejectedCount,
    protectedRiskyCount,
    apiCalls: options.apiCalls,
    weekendBlocked,
    radarTop,
    whyNoSignal,
  };
}
