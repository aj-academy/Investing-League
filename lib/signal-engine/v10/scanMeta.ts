import type { ComputedSignal } from "../types";
import { isWeekendMarket } from "../session";
import type { V9RadarItem, V9ScanMeta, V9WhyItem } from "../v9/types";
import { countByV10Permission } from "./validate";

function rankForRadar(a: ComputedSignal, b: ComputedSignal) {
  const layerOrder: Record<string, number> = {
    TRADE_ALLOWED: 5,
    LIVE: 5,
    PENDING_ORDER_SIGNAL: 4,
    PENDING_ORDER_ELIGIBLE: 4,
    CAUTION_SIGNAL: 3,
    PRACTICE: 3,
    RADAR: 2,
    AVOID_TRADE: 1,
    REJECTED: 1,
  };
  const la =
    layerOrder[a.v10Permission || a.v10Layer || a.v9Layer || "RADAR"] || 1;
  const lb =
    layerOrder[b.v10Permission || b.v10Layer || b.v9Layer || "RADAR"] || 1;
  return (
    lb - la ||
    (b.v10Quality ?? b.v10Readiness ?? b.v9Readiness ?? 0) -
      (a.v10Quality ?? a.v10Readiness ?? a.v9Readiness ?? 0) ||
    b.conf - a.conf
  );
}

export function buildV10ScanMeta(
  signals: ComputedSignal[],
  options: { apiCalls: number; marketErrors?: string[] },
): V9ScanMeta & {
  pendingCount: number;
  v10LiveCount: number;
  tradeAllowedCount: number;
  pendingOrderCount: number;
  cautionCount: number;
  avoidCount: number;
  avgSetupQuality: number;
  entryMethod?: string;
} {
  const weekendBlocked = isWeekendMarket();
  const counts = countByV10Permission(signals);
  const tradeAllowedCount = counts.tradeAllowed;
  const pendingOrderCount = counts.pendingOrder;
  const cautionCount = counts.caution;
  const avoidCount = counts.avoid;
  const liveCount = tradeAllowedCount + pendingOrderCount;
  const v10LiveCount = tradeAllowedCount;
  const pendingCount = pendingOrderCount;

  const practiceCount = signals.filter(
    (s) => s.v10Permission === "CAUTION_SIGNAL" || s.v10Layer === "PRACTICE",
  ).length;
  const radarCount = signals.filter(
    (s) => s.v10Permission === "AVOID_TRADE" || s.v10Layer === "RADAR",
  ).length;
  const rejectedCount = signals.filter((s) => s.v9Layer === "REJECTED").length;
  const protectedRiskyCount = signals.filter(
    (s) =>
      s.v10Permission === "AVOID_TRADE" ||
      s.permission === "DO NOT TRADE" ||
      (s.v10Blockers?.length ?? 0) > 0,
  ).length;

  const sorted = [...signals].sort(rankForRadar);
  const best = sorted[0];
  const avgSetupQuality = signals.length
    ? Math.round(
        signals.reduce((sum, s) => sum + (s.v10Quality ?? s.conf ?? 0), 0) / signals.length,
      )
    : 0;

  let headline = "No strong trade setup now";
  let subline =
    "Market scanned successfully. Waiting for better momentum. No trade is also a trading decision.";
  let status: V9ScanMeta["status"] = "EMPTY";

  if (options.marketErrors?.length && !signals.length) {
    headline = "No Market Data Confirmed";
    subline = "Data provider issues found. Wait and retry after rate-limit cooldown.";
    status = "DATA";
  } else if (!signals.length) {
    status = "EMPTY";
  } else if (tradeAllowedCount > 0) {
    headline = `${tradeAllowedCount} Trade Allowed — Strongest setup${tradeAllowedCount > 1 ? "s" : ""} now`;
    subline = `Best: ${best?.pair} ${best?.direction} · ${best?.v10Quality ?? best?.conf}% quality. Enter only with valid timing and quote.`;
    status = "LIVE";
  } else if (pendingOrderCount > 0) {
    headline = `${pendingOrderCount} Pending Order Signal${pendingOrderCount > 1 ? "s" : ""} — Final validation required`;
    subline = `Best: ${best?.pair} ${best?.direction}. Use pending order method; validate before entry.`;
    status = "LIVE";
  } else if (cautionCount > 0) {
    headline = `${cautionCount} Caution Signal${cautionCount > 1 ? "s" : ""} — Practice / observe only`;
    subline = `Best watched: ${best?.pair} ${best?.direction} at ${best?.v10Quality ?? 0}% quality.`;
    status = "PRACTICE";
  } else {
    headline = "Setups scanned — avoid weak conditions";
    subline = `Best available: ${best?.pair} ${best?.direction}. ${best?.v10Action || "Wait for stronger momentum."}`;
    status = "RADAR";
  }

  if (weekendBlocked) {
    subline = `Weekend / Thin Market — Live blocked. ${subline}`;
  }

  const radarTop: V9RadarItem[] = sorted.slice(0, 3).map((s) => ({
    pair: s.pair,
    direction: s.direction,
    tf: s.tf,
    readiness: s.v10Quality ?? s.v10Readiness ?? s.v9Readiness ?? 0,
    blocker: s.v10Blockers?.[0] || s.v9Blocker || s.signalReason || "Setup forming",
    nextCondition: s.v9NextCondition || s.v10Action || "Waiting for confirmation",
    v9Layer: (s.v10Layer || s.v9Layer || "RADAR") as V9RadarItem["v9Layer"],
    grade: s.grade,
    conf: s.conf,
  }));

  const whyNoSignal: V9WhyItem[] = signals
    .filter((s) => !isTradeTier(s))
    .sort(
      (a, b) =>
        (b.v10Quality ?? b.v9Readiness ?? 0) - (a.v10Quality ?? a.v9Readiness ?? 0),
    )
    .slice(0, 8)
    .map((s) => ({
      pair: s.pair,
      direction: s.direction,
      reason: s.v10Blockers?.[0] || s.v10Warnings?.[0] || s.v9Blocker || s.signalReason || "Conditions not ready",
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
    tradeAllowedCount,
    pendingOrderCount,
    cautionCount,
    avoidCount,
    avgSetupQuality,
    entryMethod: signals[0]?.entryMethod,
  };
}

function isTradeTier(s: ComputedSignal): boolean {
  return (
    s.v10Permission === "TRADE_ALLOWED" ||
    s.v10Permission === "PENDING_ORDER_SIGNAL" ||
    s.v10Layer === "LIVE" ||
    s.v10Layer === "PENDING_ORDER_ELIGIBLE"
  );
}
