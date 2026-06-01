export type PlanName = "free" | "starter" | "pro" | "admin";

export const ALL_PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
  "EUR/GBP",
] as const;

export type PairSymbol = (typeof ALL_PAIRS)[number];

export const PLAN_LIMITS = {
  free: {
    label: "Free",
    maxPairsPerScan: 8,
    allowedPairs: [...ALL_PAIRS] as PairSymbol[],
    allowedTimeframes: ["5min", "15min"] as const,
    allowBothTimeframes: true,
    dailyScanLimit: 999,
    liveUpdateMode: "cached_only" as const,
    quoteRefreshSeconds: 0,
    allowAutoScan: true,
  },
  starter: {
    label: "Starter",
    maxPairsPerScan: 4,
    allowedPairs: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"] as PairSymbol[],
    allowedTimeframes: ["5min", "15min"] as const,
    allowBothTimeframes: false,
    dailyScanLimit: 30,
    liveUpdateMode: "quote_polling" as const,
    quoteRefreshSeconds: 180,
    allowAutoScan: true,
  },
  pro: {
    label: "Pro",
    maxPairsPerScan: 8,
    allowedPairs: [...ALL_PAIRS] as PairSymbol[],
    allowedTimeframes: ["5min", "15min", "both"] as const,
    allowBothTimeframes: true,
    dailyScanLimit: 100,
    liveUpdateMode: "quote_polling" as const,
    quoteRefreshSeconds: 60,
    allowAutoScan: true,
  },
  admin: {
    label: "Admin",
    maxPairsPerScan: 8,
    allowedPairs: [...ALL_PAIRS] as PairSymbol[],
    allowedTimeframes: ["5min", "15min", "both"] as const,
    allowBothTimeframes: true,
    dailyScanLimit: 9999,
    liveUpdateMode: "full" as const,
    quoteRefreshSeconds: 30,
    allowAutoScan: true,
  },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[PlanName];
export type LiveUpdateMode = PlanLimits["liveUpdateMode"];

export function normalizePlan(plan: string | null | undefined, role?: string | null): PlanName {
  if (role === "admin") return "admin";
  if (plan === "starter" || plan === "pro" || plan === "admin") return plan;
  return "free";
}

export function getUserPlan(profile: { plan?: string | null; role?: string | null } | null): PlanName {
  return normalizePlan(profile?.plan, profile?.role);
}

export function getPlanLimits(plan: PlanName): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function resolveTimeframesForScan(
  plan: PlanName,
  timeframes: string[]
): string[] {
  const limits = getPlanLimits(plan);
  if (timeframes.includes("both")) {
    if (!limits.allowBothTimeframes) {
      throw new Error("This timeframe is not included in your current plan.");
    }
    return ["5min", "15min"];
  }
  const resolved = timeframes.filter((tf) => tf !== "both");
  for (const tf of resolved) {
    if (!planAllowsTimeframe(plan, tf)) {
      throw new Error("This timeframe is not included in your current plan.");
    }
  }
  return resolved.length ? resolved : ["5min"];
}

export function validatePairsForPlan(plan: PlanName, pairs: string[]): string[] {
  const limits = getPlanLimits(plan);
  const invalid = pairs.filter((p) => !limits.allowedPairs.includes(p as PairSymbol));
  if (invalid.length) {
    throw new Error(`This pair is not included in your current plan: ${invalid.join(", ")}`);
  }
  if (pairs.length > limits.maxPairsPerScan) {
    throw new Error(
      `Your current plan allows only ${limits.maxPairsPerScan} pair(s) per scan. Upgrade to unlock more pairs.`
    );
  }
  return pairs;
}

export function validateTimeframesForPlan(plan: PlanName, timeframes: string[]): string[] {
  return resolveTimeframesForScan(plan, timeframes);
}

export function getLockedPairs(plan: PlanName): PairSymbol[] {
  const allowed = new Set(getPlanLimits(plan).allowedPairs);
  return ALL_PAIRS.filter((p) => !allowed.has(p));
}

export function pairsForAssetSelection(plan: PlanName, asset: string): string[] {
  const limits = getPlanLimits(plan);
  if (asset === "all") return [...limits.allowedPairs];
  if (!limits.allowedPairs.includes(asset as PairSymbol)) {
    throw new Error("This pair is not included in your current plan.");
  }
  return [asset];
}

export function getRecommendedRefreshSeconds(
  plan: PlanName,
  pairCount: number,
  timeframeCount: number
): number {
  const base = getPlanLimits(plan).quoteRefreshSeconds;
  if (base <= 0) return 0;
  const load = Math.max(1, pairCount * timeframeCount);
  return Math.max(base, Math.min(300, base * Math.ceil(load / 4)));
}

export type LiveUpdateOption = "off" | "cached_only" | "180" | "60" | "30";

export function liveUpdateOptionsForPlan(plan: PlanName): LiveUpdateOption[] {
  switch (plan) {
    case "free":
      return ["off", "cached_only"];
    case "starter":
      return ["off", "cached_only", "180"];
    case "pro":
      return ["off", "cached_only", "180", "60"];
    case "admin":
      return ["off", "cached_only", "180", "60", "30"];
    default:
      return ["off", "cached_only"];
  }
}

export function liveUpdateOptionToSeconds(option: LiveUpdateOption): number {
  if (option === "off" || option === "cached_only") return 0;
  return Number(option);
}

export function planAllowsTimeframe(plan: PlanName, tf: string): boolean {
  const limits = getPlanLimits(plan);
  if (tf === "both") return limits.allowBothTimeframes;
  return (limits.allowedTimeframes as readonly string[]).includes(tf);
}

export function defaultLiveUpdateForPlan(plan: PlanName): LiveUpdateOption {
  const limits = getPlanLimits(plan);
  if (limits.liveUpdateMode === "cached_only") return "cached_only";
  if (limits.quoteRefreshSeconds >= 180) return "180";
  if (limits.quoteRefreshSeconds >= 60) return "60";
  if (limits.quoteRefreshSeconds >= 30) return "30";
  return "off";
}

/** HTML-style auto refresh: re-runs full signal engine on an interval. */
export type AutoRefreshOption = "off" | "60" | "180" | "30";

export function autoRefreshOptionsForPlan(plan: PlanName): AutoRefreshOption[] {
  switch (plan) {
    case "free":
      return ["off", "180", "60", "30"];
    case "starter":
      return ["off", "180", "60"];
    case "pro":
      return ["off", "180", "60", "30"];
    case "admin":
      return ["off", "180", "60", "30"];
    default:
      return ["off", "60"];
  }
}

export function autoRefreshToSeconds(option: AutoRefreshOption): number {
  if (option === "off") return 0;
  return Number(option);
}

export function defaultAutoRefreshForPlan(plan: PlanName): AutoRefreshOption {
  return autoRefreshOptionsForPlan(plan).includes("60") ? "60" : "off";
}

/** Map legacy liveUpdate values from older sessions. */
export function normalizeAutoRefresh(
  value: string | number | undefined,
  plan: PlanName
): AutoRefreshOption {
  const allowed = new Set(autoRefreshOptionsForPlan(plan));
  if (value === "60" || value === "180" || value === "30") {
    return allowed.has(value) ? value : "off";
  }
  if (value === "cached_only" || value === "off" || value === undefined || value === "") {
    return "off";
  }
  const n = Number(value);
  if (n === 60 && allowed.has("60")) return "60";
  if (n === 180 && allowed.has("180")) return "180";
  if (n === 30 && allowed.has("30")) return "30";
  return "off";
}
