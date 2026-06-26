import { isWeekendMarket } from "../session";
import type { ComputedSignal } from "../types";
import { V10_CONFIG } from "./config";
import { evaluateHtfBias } from "./htfBias";
import { extractIndicatorSnapshot } from "./indicators";
import { classifyStrategyType } from "./strategyType";
import type { ApplyV10Options, V10Layer, V10Permission } from "./types";

function tfKey(tf: string): "5min" | "15min" {
  return tf === "15min" ? "15min" : "5min";
}

function parseBbPercent(sig: ComputedSignal): number {
  const raw = sig.bb?.replace("%", "").trim();
  const n = parseFloat(raw);
  if (Number.isFinite(n)) return n / 100;
  return 0.5;
}

function momentumConfirmed(sig: ComputedSignal, snap: ReturnType<typeof extractIndicatorSnapshot>): boolean {
  if (!snap) return false;
  const flatTh = sig.pair.includes("JPY") ? 0.0001 : 0.000001;
  const macdFlat = Math.abs(snap.macdHist - snap.macdHistPrev) < flatTh;

  if (sig.direction === "CALL") {
    if (snap.rsi > V10_CONFIG.rsiCallHardBlock) return false;
    const rsiOk =
      snap.rsi >= V10_CONFIG.rsiCallMin &&
      snap.rsi <= V10_CONFIG.rsiCallMax &&
      snap.rsi > snap.rsiPrev;
    const macdOk =
      snap.macdLine > snap.macdSignal && snap.macdHist > snap.macdHistPrev && !macdFlat;
    const stochOk = snap.stochK > snap.stochD && snap.stochK <= V10_CONFIG.stochCallBlock;
    return rsiOk && macdOk && stochOk;
  }

  if (snap.rsi < V10_CONFIG.rsiPutHardBlock) return false;
  const rsiOk =
    snap.rsi <= V10_CONFIG.rsiPutMax &&
    snap.rsi >= V10_CONFIG.rsiPutMin &&
    snap.rsi < snap.rsiPrev;
  const macdOk =
    snap.macdLine < snap.macdSignal && snap.macdHist < snap.macdHistPrev && !macdFlat;
  const stochOk = snap.stochK < snap.stochD && snap.stochK >= V10_CONFIG.stochPutBlock;
  return rsiOk && macdOk && stochOk;
}

function mapPermissionToLayer(permission: V10Permission): V10Layer {
  switch (permission) {
    case "TRADE_ALLOWED":
      return "LIVE";
    case "PENDING_ORDER_SIGNAL":
      return "PENDING_ORDER_ELIGIBLE";
    case "CAUTION_SIGNAL":
      return "PRACTICE";
    default:
      return "RADAR";
  }
}

function downgradePermission(permission: V10Permission): V10Permission {
  switch (permission) {
    case "TRADE_ALLOWED":
      return "PENDING_ORDER_SIGNAL";
    case "PENDING_ORDER_SIGNAL":
      return "CAUTION_SIGNAL";
    case "CAUTION_SIGNAL":
      return "AVOID_TRADE";
    default:
      return "AVOID_TRADE";
  }
}

function permissionMeta(permission: V10Permission): {
  v10Label: string;
  v10Action: string;
  permission: ComputedSignal["permission"];
  signalTypeLabel: string;
} {
  switch (permission) {
    case "TRADE_ALLOWED":
      return {
        v10Label: "TRADE ALLOWED",
        v10Action: "Trade allowed only if entry timing and platform price are valid.",
        permission: "TRADE ALLOWED",
        signalTypeLabel: "V10 TRADE ALLOWED",
      };
    case "PENDING_ORDER_SIGNAL":
      return {
        v10Label: "PENDING ORDER SIGNAL",
        v10Action: "Use pending order method only. Final validation required before entry.",
        permission: "OBSERVE ONLY",
        signalTypeLabel: "V10 PENDING SIGNAL",
      };
    case "CAUTION_SIGNAL":
      return {
        v10Label: "CAUTION SIGNAL",
        v10Action: "Practice or observe only. Not recommended for real trade.",
        permission: "OBSERVE ONLY",
        signalTypeLabel: "V10 CAUTION SIGNAL",
      };
    default:
      return {
        v10Label: "AVOID TRADE",
        v10Action: "Avoid this trade. Market condition is not strong enough.",
        permission: "DO NOT TRADE",
        signalTypeLabel: "V10 AVOID TRADE",
      };
  }
}

/** V10 permission on every candidate — keeps v9Layer unchanged. */
export function applyV10Permission(
  signals: ComputedSignal[],
  options?: ApplyV10Options,
): ComputedSignal[] {
  const now = options?.now ?? new Date();
  const weekend = isWeekendMarket(now);

  return signals.map((s) => {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const is5 = s.tf === "5min";
    const snap = extractIndicatorSnapshot(s);

    const quality = Number(s.conf || 0);
    const gap = Number(s.scoreGap || 0);
    const adx = Number(s.adx || snap?.adx || 0);
    const bodyRatio = Number(s.candleBodyRatio || snap?.closedBodyRatio || 0);
    const bbPB = snap?.bbPB ?? parseBbPercent(s);

    const tradeGap = is5 ? V10_CONFIG.tradeGap5 : V10_CONFIG.tradeGap15;
    const pendingGap = is5 ? V10_CONFIG.pendingGap5 : V10_CONFIG.pendingGap15;
    const tradeBody = is5 ? V10_CONFIG.candleBodyTrade5 : V10_CONFIG.candleBodyTrade15;
    const pendingBody = is5 ? V10_CONFIG.candleBodyPending5 : V10_CONFIG.candleBodyPending15;

    if (s.direction === "CALL" && bbPB >= V10_CONFIG.bbCallExtreme) {
      blockers.push("Price is overextended near upper Bollinger zone");
    }
    if (s.direction === "PUT" && bbPB <= V10_CONFIG.bbPutExtreme) {
      blockers.push("Price is overextended near lower Bollinger zone");
    }

    if (bodyRatio < 12) {
      blockers.push("Doji candle — no clear direction");
    } else if (bodyRatio < pendingBody) {
      warnings.push("Candle body is weak");
    }

    if (adx < V10_CONFIG.minAdxPending) {
      warnings.push("Trend strength is low");
    }
    if (gap < pendingGap) {
      warnings.push("Score gap is not strong enough");
    }

    if (s.overExtendedBull && s.direction === "CALL") {
      warnings.push("Price overextended above trend");
    }
    if (s.overExtendedBear && s.direction === "PUT") {
      warnings.push("Price overextended below trend");
    }
    if (s.bigCandle) {
      warnings.push("Candle already too large");
    }
    if (weekend) {
      warnings.push("Weekend / thin market — live trading blocked");
    }

    let v10Permission: V10Permission;

    if (
      quality >= V10_CONFIG.tradeAllowedQuality &&
      gap >= tradeGap &&
      adx >= V10_CONFIG.minAdxTrade &&
      bodyRatio >= tradeBody &&
      blockers.length === 0 &&
      momentumConfirmed(s, snap)
    ) {
      v10Permission = "TRADE_ALLOWED";
    } else if (
      quality >= V10_CONFIG.pendingSignalQuality &&
      gap >= pendingGap &&
      adx >= V10_CONFIG.minAdxPending &&
      bodyRatio >= pendingBody &&
      blockers.length === 0
    ) {
      v10Permission = "PENDING_ORDER_SIGNAL";
    } else if (quality >= V10_CONFIG.cautionSignalQuality && blockers.length === 0) {
      v10Permission = "CAUTION_SIGNAL";
    } else {
      v10Permission = "AVOID_TRADE";
    }

    if (is5 && options?.htfCandlesByPair) {
      const htf = evaluateHtfBias(options.htfCandlesByPair.get(s.pair), s.direction);
      if (!htf.ok && htf.status !== "15m data unavailable") {
        warnings.push("15m trend conflict — permission downgraded");
        v10Permission = downgradePermission(v10Permission);
      } else if (htf.status === "15m data unavailable") {
        warnings.push("15m HTF data unavailable — use extra caution");
      }
    }

    if (weekend && (v10Permission === "TRADE_ALLOWED" || v10Permission === "PENDING_ORDER_SIGNAL")) {
      v10Permission = downgradePermission(v10Permission);
    }

    const meta = permissionMeta(v10Permission);
    const strategyType = classifyStrategyType(s);

    return {
      ...s,
      v9Layer: s.v9Layer,
      v10Permission,
      v10Label: meta.v10Label,
      v10Action: meta.v10Action,
      v10Quality: quality,
      v10Warnings: warnings,
      v10Blockers: [...blockers, ...warnings.filter((w) => w.includes("downgraded"))],
      v10Layer: mapPermissionToLayer(v10Permission),
      v10StrategyType: strategyType,
      htfBiasStatus:
        is5 && options?.htfCandlesByPair
          ? evaluateHtfBias(options.htfCandlesByPair.get(s.pair), s.direction).status
          : s.htfBiasStatus,
      setupQuality: quality,
      v10Readiness: s.v9Readiness ?? quality,
      entryMethod: options?.entryMethod ?? s.entryMethod,
      signalDetectedAt: s.signalDetectedAt ?? now.toISOString(),
      tradeEligible:
        v10Permission === "TRADE_ALLOWED" || v10Permission === "PENDING_ORDER_SIGNAL",
      entryNote: meta.v10Action,
    };
  });
}

const PERMISSION_RANK: Record<V10Permission, number> = {
  TRADE_ALLOWED: 4,
  PENDING_ORDER_SIGNAL: 3,
  CAUTION_SIGNAL: 2,
  AVOID_TRADE: 1,
};

/** Rank and return top setups — scan never looks empty when candidates exist. */
export function rankV10Signals(signals: ComputedSignal[]): ComputedSignal[] {
  return [...signals]
    .filter((s) => s?.pair && s?.direction)
    .sort((a, b) => {
      const pa = PERMISSION_RANK[a.v10Permission || "AVOID_TRADE"] || 0;
      const pb = PERMISSION_RANK[b.v10Permission || "AVOID_TRADE"] || 0;
      if (pb !== pa) return pb - pa;
      const qa = Number(a.v10Quality ?? a.conf ?? 0);
      const qb = Number(b.v10Quality ?? b.conf ?? 0);
      if (qb !== qa) return qb - qa;
      return b.scoreGap - a.scoreGap;
    })
    .slice(0, V10_CONFIG.maxSignalsToShow)
    .map((s, i) => ({ ...s, liveRank: i + 1 }));
}
