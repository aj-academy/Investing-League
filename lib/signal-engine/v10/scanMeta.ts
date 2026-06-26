import type { ComputedSignal } from "../types";
import { isWeekendMarket } from "../session";
import type { V9RadarItem, V9ScanMeta, V9WhyItem } from "../v9/types";

function rankForRadar(a: ComputedSignal, b: ComputedSignal) {
  const layerOrder: Record<string, number> = {
    LIVE: 5,
    PENDING_ORDER_ELIGIBLE: 4,
    PRACTICE: 3,
    RADAR: 2,
    REJECTED: 1,
  };
  const la = layerOrder[a.v10Layer || a.v9Layer || "RADAR"] || 1;
  const lb = layerOrder[b.v10Layer || b.v9Layer || "RADAR"] || 1;
  return (
    lb - la ||
    (b.v10Readiness ?? b.v9Readiness ?? 0) - (a.v10Readiness ?? a.v9Readiness ?? 0) ||
    b.conf - a.conf
  );
}

export function buildV10ScanMeta(
  signals: ComputedSignal[],
  options: { apiCalls: number; marketErrors?: string[] },
): V9ScanMeta & {
  pendingCount: number;
  v10LiveCount: number;
  entryMethod?: string;
} {
  const weekendBlocked = isWeekendMarket();
  const v10LiveCount = signals.filter((s) => s.v10Layer === "LIVE").length;
  const pendingCount = signals.filter((s) => s.v10Layer === "PENDING_ORDER_ELIGIBLE").length;
  const liveCount = v10LiveCount + pendingCount;
  const practiceCount = signals.filter((s) => s.v10Layer === "PRACTICE").length;
  const radarCount = signals.filter((s) => s.v10Layer === "RADAR").length;
  const rejectedCount = signals.filter((s) => s.v10Layer === "REJECTED").length;
  const protectedRiskyCount = signals.filter(
    (s) =>
      s.v10Layer === "REJECTED" ||
      s.permission === "DO NOT TRADE" ||
      (s.v10Blockers?.length ?? 0) > 0,
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
  } else if (v10LiveCount > 0) {
    headline = `${v10LiveCount} Live Trade Permission${v10LiveCount > 1 ? "s" : ""}`;
    subline = `Best setup: ${best?.pair} ${best?.direction}. Enter only inside valid window.`;
    status = "LIVE";
  } else if (pendingCount > 0) {
    headline = `${pendingCount} Pending Order Eligible`;
    subline = `Place pending order before entry time — ${best?.pair} ${best?.direction}.`;
    status = "LIVE";
  } else if (practiceCount > 0) {
    headline = `No Trade Allowed Yet · ${practiceCount} Practice Setup${practiceCount > 1 ? "s" : ""}`;
    subline = `Market has direction, but live permission is protected. Best practice: ${best?.pair} ${best?.direction}.`;
    status = "PRACTICE";
  } else {
    subline = `Market checked. Best radar: ${best?.pair} ${best?.direction} at ${best?.v9Readiness ?? 0}% ready.`;
    status = "RADAR";
  }

  if (weekendBlocked) {
    subline = `Weekend / Thin Market — Live blocked. ${subline}`;
  }

  const radarTop: V9RadarItem[] = sorted.slice(0, 3).map((s) => ({
    pair: s.pair,
    direction: s.direction,
    tf: s.tf,
    readiness: s.v10Readiness ?? s.v9Readiness ?? 0,
    blocker: s.v10Blockers?.[0] || s.v9Blocker || s.signalReason || "Setup forming",
    nextCondition: s.v9NextCondition || "Waiting for confirmation",
    v9Layer: (s.v10Layer || s.v9Layer || "RADAR") as V9RadarItem["v9Layer"],
    grade: s.grade,
    conf: s.conf,
  }));

  const whyNoSignal: V9WhyItem[] = signals
    .filter((s) => s.v10Layer !== "LIVE" && s.v10Layer !== "PENDING_ORDER_ELIGIBLE")
    .sort((a, b) => (b.v10Readiness ?? b.v9Readiness ?? 0) - (a.v10Readiness ?? a.v9Readiness ?? 0))
    .slice(0, 8)
    .map((s) => ({
      pair: s.pair,
      direction: s.direction,
      reason: s.v10Blockers?.[0] || s.v9Blocker || s.signalReason || "Conditions not ready",
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
    pendingCount,
    v10LiveCount,
    entryMethod: signals[0]?.entryMethod,
  };
}
