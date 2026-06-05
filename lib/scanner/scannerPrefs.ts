import {
  normalizeAutoRefresh,
  type AutoRefreshOption,
  type PlanName,
} from "@/lib/billing/planLimits";
import type { MinGradeFilter } from "@/lib/signal-engine/permission";
import type { ScanSettings } from "@/components/dashboard/DashboardClient";

const SETTINGS_KEY = "til_scanner_settings_v1";

const TIMEFRAMES = new Set(["5min", "15min", "both"]);
const SESSIONS = new Set(["any", "london", "newyork", "overlap"]);
const MODES = new Set(["practice", "live"]);
const GRADES = new Set<MinGradeFilter>(["B", "A", "A+"]);
const TRADE_LIMITS = new Set([3, 5, 8, 999]);

function sanitizeStored(
  raw: Partial<ScanSettings>,
  defaults: ScanSettings,
  plan: PlanName,
): ScanSettings {
  const mode = MODES.has(raw.mode as "practice" | "live")
    ? (raw.mode as "practice" | "live")
    : defaults.mode;
  const timeframe = TIMEFRAMES.has(String(raw.timeframe))
    ? String(raw.timeframe)
    : defaults.timeframe;
  const minGrade = GRADES.has(raw.minGrade as MinGradeFilter)
    ? (raw.minGrade as MinGradeFilter)
    : defaults.minGrade;
  const session = SESSIONS.has(String(raw.session)) ? String(raw.session) : defaults.session;
  const dailyTradeLimit = TRADE_LIMITS.has(Number(raw.dailyTradeLimit))
    ? Number(raw.dailyTradeLimit)
    : defaults.dailyTradeLimit;
  const autoRefresh = normalizeAutoRefresh(
    (raw.autoRefresh as AutoRefreshOption | undefined) ?? defaults.autoRefresh,
    plan,
  );

  return {
    ...defaults,
    mode,
    timeframe,
    minGrade,
    minScore: defaults.minScore,
    session,
    dailyTradeLimit,
    autoRefresh,
  };
}

export function loadScannerPrefs(defaults: ScanSettings, plan: PlanName): ScanSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<ScanSettings>;
    return sanitizeStored(raw, defaults, plan);
  } catch {
    return defaults;
  }
}

export function saveScannerPrefs(settings: ScanSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* private mode / quota */
  }
}
