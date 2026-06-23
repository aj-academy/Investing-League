"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession } from "@/lib/auth/clearAdminSession";
import { createClient } from "@/lib/supabase/client";
import type { AutoRefreshOption, PlanName } from "@/lib/billing/planLimits";
import {
  autoRefreshToSeconds,
  clampTimeframeToPlan,
  getPlanLimits,
  normalizeAutoRefresh,
} from "@/lib/billing/planLimits";
import type { MinGradeFilter } from "@/lib/signal-engine/permission";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import type { V9ScanMeta } from "@/lib/signal-engine/v9/types";
import { filterByShowSignals } from "@/lib/signal-engine/v9/classify";
import { hydrateV9ScanResult } from "@/lib/signal-engine/v9/hydrate";
import { playScanAlerts } from "@/lib/sound/signalAlerts";
import { toast } from "sonner";
import { AssetChipGrid, loadStoredPairs, saveStoredPairs } from "./AssetChipGrid";
import { PlanUsageCard } from "./PlanUsageCard";
import { RulesModal } from "@/components/rules/RulesModal";
import {
  CapitalProtectionCard,
  CapitalProtectionModal,
} from "@/components/risk/CapitalProtectionCard";
import { LossLimitModal } from "@/components/risk/LossLimitModal";
import type { RecoveryMetrics, RiskStatus } from "@/lib/risk/types";
import { LoadingScanner } from "./LoadingScanner";
import { MarketTicker } from "./MarketTicker";
import { ScannerControls } from "./ScannerControls";
import { SessionPills } from "./SessionPills";
import { SignalCard } from "./SignalCard";
import { StatsRow } from "./StatsRow";
import { SupportPanel } from "./SupportPanel";
import { V9ScanSummary } from "./V9ScanSummary";
import { OpportunityRadar } from "./OpportunityRadar";
import { WhyNoSignalPanel } from "./WhyNoSignalPanel";
import { Topbar } from "../layout/Topbar";
import type { TickerItem } from "@/lib/market/tickerService";
import { resolveTimeZone, timeZoneAbbreviation } from "@/lib/datetime";
import { loadScannerPrefs, saveScannerPrefs } from "@/lib/scanner/scannerPrefs";
import { readScanFromSessionCache, saveScanToSessionCache } from "@/lib/signals/scanCache";

function clientTimeZone() {
  if (typeof Intl !== "undefined") {
    return resolveTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
  return resolveTimeZone();
}

import type { ShowSignalsFilter } from "@/lib/signal-engine/v9/types";

export interface ScanSettings {
  timeframe: string;
  minGrade: MinGradeFilter;
  minScore: number;
  dailyTradeLimit: number;
  session: string;
  autoRefresh: AutoRefreshOption;
  mode: "practice" | "live";
  showSignals: ShowSignalsFilter;
}

export interface PlanInfo {
  plan: PlanName;
  scansUsedToday: number;
  scansRemainingToday: number;
  dailyScanLimit: number;
  totalScans: number;
}

export function DashboardClient({
  initialSettings,
  planInfo,
  allowedPairs,
}: {
  initialSettings: ScanSettings;
  planInfo: PlanInfo;
  allowedPairs: string[];
}) {
  const router = useRouter();
  const planLimits = useMemo(() => getPlanLimits(planInfo.plan), [planInfo.plan]);

  const serverDefaults = useMemo<ScanSettings>(
    () => ({
      ...initialSettings,
      timeframe: clampTimeframeToPlan(planInfo.plan, initialSettings.timeframe),
      autoRefresh: normalizeAutoRefresh(
        (initialSettings as ScanSettings & { liveUpdate?: string }).liveUpdate ??
          initialSettings.autoRefresh,
        planInfo.plan,
      ),
    }),
    [initialSettings, planInfo.plan],
  );
  const [settings, setSettings] = useState<ScanSettings>(serverDefaults);
  const settingsRef = useRef(settings);
  const pairsInitializedRef = useRef(false);
  const hasScannedRef = useRef(false);
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [signals, setSignals] = useState<ComputedSignal[]>([]);
  const [v9Meta, setV9Meta] = useState<V9ScanMeta | null>(null);

  const displaySignals = useMemo(
    () => filterByShowSignals(signals, settings.showSignals),
    [signals, settings.showSignals],
  );

  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaderText, setLoaderText] = useState("SCANNING");
  const [loaderSub, setLoaderSub] = useState("");
  const [marketLive, setMarketLive] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [scanUsage, setScanUsage] = useState(planInfo);
  const [refreshing, setRefreshing] = useState(false);
  const [lastScanNote, setLastScanNote] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [autoScanning, setAutoScanning] = useState(false);
  const [apiCalls, setApiCalls] = useState<number | undefined>();
  const [marketErrors, setMarketErrors] = useState<string[]>([]);
  const [termsState, setTermsState] = useState<{
    loading: boolean;
    required: boolean;
    active: null | { id: string; title: string; version: string; content: string | null; file_url: string | null };
  }>({ loading: true, required: false, active: null });
  const [acceptingTerms, setAcceptingTerms] = useState(false);
  const [rulesState, setRulesState] = useState<{
    loading: boolean;
    required: boolean;
    active: null | { id: string; title: string; content: string; updated_at: string };
  }>({ loading: true, required: false, active: null });
  const [acknowledgingRules, setAcknowledgingRules] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [riskStatus, setRiskStatus] = useState<RiskStatus>("normal");
  const [liveModeLocked, setLiveModeLocked] = useState(false);
  const [todayNetProfit, setTodayNetProfit] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [startingCapital, setStartingCapital] = useState(0);
  const [currentCapital, setCurrentCapital] = useState(0);
  const [recovery, setRecovery] = useState<RecoveryMetrics | null>(null);
  const [migrationWarning, setMigrationWarning] = useState<string | null>(null);
  const [cppModalOpen, setCppModalOpen] = useState(false);
  const [cppSaving, setCppSaving] = useState(false);
  const [cppValues, setCppValues] = useState({
    startingCapital: 0,
    currentCapital: 0,
    riskPerTradePercent: 5,
    dailyProfitTargetPercent: 10,
    dailyProfitTargetAmount: 0,
    dailyLossLimitPercent: 15,
    maxConsecutiveLosses: 3,
  });
  const [showLossModal, setShowLossModal] = useState(false);
  const autoScanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runScanRef = useRef<(opts?: { auto?: boolean }) => Promise<void>>(async () => {});
  const lockedPairsRef = useRef<string[] | null>(null);
  const [timeZone, setTimeZone] = useState(resolveTimeZone());
  const [tzLabel, setTzLabel] = useState("");

  useEffect(() => {
    const tz = clientTimeZone();
    setTimeZone(tz);
    setTzLabel(timeZoneAbbreviation(tz));
  }, []);

  useEffect(() => {
    setSettings(loadScannerPrefs(serverDefaults, planInfo.plan));
  }, [serverDefaults, planInfo.plan]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<ScanSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveScannerPrefs(next);
      settingsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!allowedPairs.length) return;
    if (!pairsInitializedRef.current) {
      pairsInitializedRef.current = true;
      setSelectedPairs(loadStoredPairs(allowedPairs));
      return;
    }
    setSelectedPairs((prev) => {
      const filtered = prev.filter((p) => allowedPairs.includes(p));
      const next = filtered.length ? filtered : loadStoredPairs(allowedPairs);
      saveStoredPairs(next);
      return next;
    });
  }, [allowedPairs]);

  const applyScanResult = useCallback(
    (
      rawSignals: ComputedSignal[],
      options?: {
        v9?: V9ScanMeta | null;
        apiCalls?: number;
        marketErrors?: string[];
        scanSessionId?: string;
        ticker?: TickerItem[];
      },
    ) => {
      const { signals: layered, v9 } = hydrateV9ScanResult(rawSignals, {
        v9: options?.v9,
        apiCalls: options?.apiCalls,
        marketErrors: options?.marketErrors,
      });
      setSignals(layered);
      setV9Meta(v9);
      if (options?.ticker?.length) setTicker(options.ticker);
      if (layered.length || v9) {
        saveScanToSessionCache({
          ts: Date.now(),
          scanSessionId: options?.scanSessionId,
          signals: layered,
          ticker: options?.ticker,
          v9,
        });
      }
      if (layered.length) playScanAlerts(layered);
      return layered;
    },
    [],
  );

  const applyLatestScan = useCallback(
    (json: {
      signals?: ComputedSignal[];
      v9?: V9ScanMeta | null;
      ticker?: TickerItem[];
      message?: string;
      hasLatest?: boolean;
      scanSessionId?: string;
    }) => {
      if (json.signals?.length || json.v9) {
        applyScanResult(json.signals || [], {
          v9: json.v9,
          ticker: json.ticker,
          scanSessionId: json.scanSessionId,
        });
        setRestoreMessage(json.message || null);
        return true;
      }
      return false;
    },
    [applyScanResult],
  );

  const pairsForScan = useCallback(
    (isAuto: boolean) => {
      if (isAuto && lockedPairsRef.current?.length) {
        return lockedPairsRef.current.filter((p) => allowedPairs.includes(p));
      }
      const sel = selectedPairs.filter((p) => allowedPairs.includes(p));
      return sel.length ? sel : allowedPairs;
    },
    [allowedPairs, selectedPairs]
  );

  const clearAutoSchedule = useCallback(() => {
    if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    autoScanTimerRef.current = null;
    countdownTimerRef.current = null;
    setCountdown(0);
  }, []);

  const stopAutoScan = useCallback(() => {
    clearAutoSchedule();
    setAutoScanning(false);
    updateSettings({ autoRefresh: "off" });
    toast.message("Auto scan stopped");
  }, [clearAutoSchedule, updateSettings]);

  useEffect(() => {
    if (settings.autoRefresh === "off") clearAutoSchedule();
  }, [settings.autoRefresh, clearAutoSchedule]);

  const scheduleAutoScan = useCallback(
    (seconds: number) => {
      clearAutoSchedule();
      if (seconds <= 0) return;

      setCountdown(seconds);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((c) => (c <= 1 ? 0 : c - 1));
      }, 1000);

      autoScanTimerRef.current = setTimeout(() => {
        clearAutoSchedule();
        void runScanRef.current({ auto: true });
      }, seconds * 1000);
    },
    [clearAutoSchedule]
  );

  const reloadLastScan = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/signals/latest");
      const json = await res.json();
      if (applyLatestScan(json)) {
        toast.success(json.message || "Last V9 scan loaded");
      } else {
        toast.message(json.message || "No recent scan to reload");
      }
    } catch {
      toast.error("Could not reload last scan");
    } finally {
      setRefreshing(false);
    }
  }, [applyLatestScan]);

  useEffect(() => {
    const cached = readScanFromSessionCache();
    if (cached?.signals?.length || cached?.v9) {
      applyScanResult(cached?.signals || [], {
        v9: cached?.v9,
        ticker: cached?.ticker,
        scanSessionId: cached?.scanSessionId,
      });
      setRestoreMessage("Restored your last V9 scan from this browser session.");
    }

    fetch("/api/signals/latest")
      .then((r) => r.json())
      .then((json) => {
        if (hasScannedRef.current) return;
        applyLatestScan(json);
      })
      .catch(() => {
        /* no latest scan */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  useEffect(() => {
    fetch("/api/terms/active")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) {
          setTermsState({ loading: false, required: false, active: null });
          return;
        }
        setTermsState({
          loading: false,
          required: Boolean(json.active && !json.accepted),
          active: json.active || null,
        });
      })
      .catch(() => {
        setTermsState({ loading: false, required: false, active: null });
      });
  }, []);

  useEffect(() => {
    fetch("/api/rules/active")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) {
          setRulesState({ loading: false, required: false, active: null });
          return;
        }
        setRulesState({
          loading: false,
          required: Boolean(json.acknowledgementRequired),
          active: json.active || null,
        });
      })
      .catch(() => {
        setRulesState({ loading: false, required: false, active: null });
      });
  }, []);

  useEffect(() => {
    if (
      !termsState.loading &&
      !termsState.required &&
      !rulesState.loading &&
      rulesState.required &&
      rulesState.active
    ) {
      setRulesModalOpen(true);
    }
  }, [
    termsState.loading,
    termsState.required,
    rulesState.loading,
    rulesState.required,
    rulesState.active,
  ]);

  const acknowledgeRules = useCallback(async () => {
    setAcknowledgingRules(true);
    try {
      const res = await fetch("/api/rules/acknowledge", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error || "Could not acknowledge rules");
        return;
      }
      toast.success("Platform rules acknowledged.");
      setRulesState((s) => ({ ...s, required: false }));
      setRulesModalOpen(false);
    } catch {
      toast.error("Could not acknowledge rules");
    } finally {
      setAcknowledgingRules(false);
    }
  }, []);

  const loadRiskStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/capital-protection", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) return;
      const start = Number(json.profile?.starting_capital) || 0;
      const current = Number(json.profile?.current_capital) || 0;
      setRiskStatus(json.riskStatus || "normal");
      setLiveModeLocked(Boolean(json.liveModeLocked));
      setTodayNetProfit(Number(json.todayNetProfit) || 0);
      setConsecutiveLosses(Number(json.consecutiveLosses) || 0);
      setStartingCapital(start);
      setCurrentCapital(current);
      setRecovery(json.recovery || null);
      setMigrationWarning(json.warning || null);
      setCppValues({
        startingCapital: start,
        currentCapital: current,
        riskPerTradePercent: Number(json.profile?.risk_per_trade_percent) || 5,
        dailyProfitTargetPercent: Number(json.profile?.daily_profit_target_percent) || 10,
        dailyProfitTargetAmount: Number(json.profile?.daily_profit_target_amount) || 0,
        dailyLossLimitPercent: Number(json.profile?.daily_loss_limit_percent) || 15,
        maxConsecutiveLosses: Number(json.profile?.max_consecutive_losses) || 3,
      });
      if (
        json.liveModeLocked &&
        json.consecutiveLosses >= (json.profile?.max_consecutive_losses || 3)
      ) {
        setShowLossModal(true);
      }
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void loadRiskStatus();
  }, [loadRiskStatus]);

  const saveCapitalPlan = useCallback(async () => {
    setCppSaving(true);
    try {
      const res = await fetch("/api/capital-protection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startingCapital: cppValues.startingCapital,
          currentCapital: cppValues.currentCapital,
          riskPerTradePercent: cppValues.riskPerTradePercent,
          dailyProfitTargetPercent: cppValues.dailyProfitTargetPercent,
          dailyProfitTargetAmount: cppValues.dailyProfitTargetAmount,
          dailyLossLimitPercent: cppValues.dailyLossLimitPercent,
          maxConsecutiveLosses: cppValues.maxConsecutiveLosses,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not save plan");
        return;
      }
      const p = json.profile;
      const savedStart = Number(p?.starting_capital ?? cppValues.startingCapital);
      const savedCurrent = Number(p?.current_capital ?? cppValues.currentCapital);
      setStartingCapital(savedStart);
      setCurrentCapital(savedCurrent);
      setCppValues((s) => ({
        ...s,
        startingCapital: savedStart,
        currentCapital: savedCurrent,
        riskPerTradePercent: Number(p?.risk_per_trade_percent ?? s.riskPerTradePercent),
        dailyProfitTargetPercent: Number(p?.daily_profit_target_percent ?? s.dailyProfitTargetPercent),
        dailyProfitTargetAmount: Number(p?.daily_profit_target_amount ?? s.dailyProfitTargetAmount),
        dailyLossLimitPercent: Number(p?.daily_loss_limit_percent ?? s.dailyLossLimitPercent),
        maxConsecutiveLosses: Number(p?.max_consecutive_losses ?? s.maxConsecutiveLosses),
      }));
      toast.success("Capital Protection Plan saved — see limits below.");
      setRecovery(json.recovery || null);
      setCppModalOpen(false);
      void loadRiskStatus();
    } catch {
      toast.error("Could not save plan");
    } finally {
      setCppSaving(false);
    }
  }, [cppValues, loadRiskStatus]);

  useEffect(() => {
    return () => clearAutoSchedule();
  }, [clearAutoSchedule]);

  const runScan = useCallback(async (opts?: { auto?: boolean }) => {
    const isAuto = Boolean(opts?.auto);
    if (termsState.required) {
      if (!isAuto) toast.error("Accept the latest Terms & Conditions before scanning.");
      return;
    }
    if (rulesState.required) {
      if (!isAuto) {
        toast.error("Acknowledge the latest Platform Rules before scanning.");
        setRulesModalOpen(true);
      }
      return;
    }
    if (settingsRef.current.mode === "live" && liveModeLocked) {
      if (!isAuto) {
        toast.error(
          "Live Mode paused for capital protection. You can continue Practice Mode or review your journal.",
        );
        updateSettings({ mode: "practice" });
      }
      return;
    }
    if (scanning || autoScanning) return;

    if (isAuto) {
      setAutoScanning(true);
      setLoaderText("AUTO REFRESH");
      setLoaderSub("Updating live market setups...");
    } else {
      setScanning(true);
      setProgress(0);
      setSignals([]);
      setV9Meta(null);
      setRestoreMessage(null);
      setMarketErrors([]);
      setLoaderText("V9 SCANNING");
      setLoaderSub("Running V9 decision engine — Live · Practice · Radar layers...");
    }

    const activeSettings = settingsRef.current;
    const pairs = pairsForScan(isAuto);
    if (!pairs.length) {
      toast.error("Select at least one asset to scan.");
      if (isAuto) setAutoScanning(false);
      else setScanning(false);
      return;
    }

    if (!isAuto) {
      lockedPairsRef.current = [...pairs];
    }

    const timeframes =
      activeSettings.timeframe === "both" ? ["both"] : [activeSettings.timeframe];

    try {
      const res = await fetch("/api/signals/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairs,
          timeframes,
          mode: activeSettings.mode,
          minScore: activeSettings.minScore,
          minGrade: activeSettings.minGrade,
          showBSignals: activeSettings.minGrade === "B",
          dailyTradeLimit: activeSettings.dailyTradeLimit,
          sessionFilter: activeSettings.session,
          auto: isAuto,
          timezone: timeZone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "PLAN_LIMIT") {
          toast.error(json.message || "Plan limit reached");
        } else if (json.code === "DAILY_SCAN_LIMIT") {
          toast.error(json.message || "Daily scan limit reached");
          if (isAuto) {
            clearAutoSchedule();
            updateSettings({ autoRefresh: "off" });
          }
        } else if (json.code === "LIVE_MODE_LOCKED") {
          toast.error(json.message || "Live Mode paused for capital protection.");
          setLiveModeLocked(true);
          updateSettings({ mode: "practice" });
          setShowLossModal(true);
        } else {
          toast.error(json.error || json.message || "Scan failed");
        }
        if (isAuto) setAutoScanning(false);
        else setScanning(false);
        return;
      }
      hasScannedRef.current = true;
      const list =
        (json.allSignals?.length ? json.allSignals : json.signals) || [];
      applyScanResult(list, {
        v9: json.v9,
        apiCalls: json.usage?.providerCalls,
        marketErrors: json.marketErrors,
        scanSessionId: json.scanSessionId,
        ticker: json.ticker,
      });
      setMarketLive(Boolean(json.ticker?.length));
      setApiCalls(json.usage?.providerCalls);
      setMarketErrors(json.marketErrors || []);
      if (json.usage) {
        setScanUsage((prev) => ({
          plan: json.usage.plan,
          scansUsedToday: json.usage.scansUsedToday,
          scansRemainingToday: json.usage.scansRemainingToday,
          dailyScanLimit: json.usage.dailyScanLimit,
          totalScans: prev.totalScans + 1,
        }));
      }
      setLastScanNote(
        list.length === 0
          ? json.message
          : json.filteredSignalCount < json.rawSignalCount
            ? `V9: showing ${list.length} setup(s). ${json.journalSaved ?? 0} saved to journal.`
            : null
      );
      void loadRiskStatus();
      setProgress(100);
      if (!isAuto) {
        if (json.journalSaved > 0) {
          toast.success(json.message);
        } else if (list.length > 0 && json.persistErrors?.length) {
          toast.error(json.message || "Setups shown but could not save — check server config.");
        } else if (list.length > 0) {
          toast.success(`Scan complete — ${list.length} setup(s) on screen`);
        } else {
          toast.message(json.message || "Scan finished — adjust filters or check market data");
        }
      }

      const intervalSec = autoRefreshToSeconds(activeSettings.autoRefresh);
      scheduleAutoScan(intervalSec);
    } catch {
      if (!isAuto) toast.error("Scan request failed");
    } finally {
      if (isAuto) setAutoScanning(false);
      else {
        setScanning(false);
        setTimeout(() => setProgress(0), 1000);
      }
    }
  }, [
    scanning,
    autoScanning,
    clearAutoSchedule,
    scheduleAutoScan,
    pairsForScan,
    termsState.required,
    rulesState.required,
    liveModeLocked,
    applyScanResult,
    loadRiskStatus,
    timeZone,
    updateSettings,
  ]);

  runScanRef.current = runScan;

  return (
    <>
      <Topbar
        scansToday={scanUsage.scansUsedToday}
        live={marketLive || autoScanning || scanning}
        countdown={countdown}
        timeZone={timeZone}
        timeZoneLabel={tzLabel}
      />
      <div className="wrap z">
        <section className="scanner-section" aria-label="Market scanner">
          <header className="scanner-section-head">
            <div className="scanner-section-intro">
              <span className="scanner-section-kicker">V9 Decision Engine</span>
              <h2 className="scanner-section-title">Market Scanner</h2>
              <p className="scanner-section-sub">
                Live permission · Practice signals · Opportunity Radar · Why-no-signal — same V8
                core, V9 classification layer.
              </p>
            </div>
          </header>

          <CapitalProtectionCard
            startingCapital={startingCapital}
            currentCapital={currentCapital}
            todayNetProfit={todayNetProfit}
            consecutiveLosses={consecutiveLosses}
            riskStatus={riskStatus}
            liveModeLocked={liveModeLocked}
            riskPerTradePercent={cppValues.riskPerTradePercent}
            dailyProfitTargetPercent={cppValues.dailyProfitTargetPercent}
            dailyProfitTargetAmount={cppValues.dailyProfitTargetAmount}
            dailyLossLimitPercent={cppValues.dailyLossLimitPercent}
            maxConsecutiveLosses={cppValues.maxConsecutiveLosses}
            recovery={recovery}
            onEdit={() => setCppModalOpen(true)}
          />

          {liveModeLocked && (
            <div className="disclaimer-banner cpp-live-lock-banner">
              Live Mode is paused for 30 minutes after consecutive losses. Practice Mode remains
              available. Live unlocks automatically when the timer ends.
            </div>
          )}

          <PlanUsageCard
            plan={scanUsage.plan}
            scansUsedToday={scanUsage.scansUsedToday}
            scansRemainingToday={scanUsage.scansRemainingToday}
            dailyScanLimit={scanUsage.dailyScanLimit}
            totalScans={scanUsage.totalScans}
            onRulesClick={() => {
              if (rulesState.active) {
                setRulesModalOpen(true);
              } else {
                toast.message("Platform rules are not available yet.");
              }
            }}
          />

          <MarketTicker items={ticker} live={marketLive || scanning || autoScanning} />

          <div className="scanner-panel">
            <AssetChipGrid
              allowedPairs={allowedPairs}
              selected={selectedPairs}
              maxPairsPerScan={planLimits.maxPairsPerScan}
              disabled={scanning || autoScanning}
              onChange={setSelectedPairs}
            />
            <ScannerControls
              plan={planInfo.plan}
              settings={settings}
              onChange={updateSettings}
              filtersLocked={scanning || autoScanning}
              onScan={() => runScan()}
              onRefreshPrices={async () => {
                setRefreshing(true);
                await runScan();
                setRefreshing(false);
              }}
              onReloadLastScan={reloadLastScan}
              onStopAutoScan={stopAutoScan}
              scanning={scanning || autoScanning}
              autoScanning={autoScanning}
              autoScanCountdown={countdown}
              refreshing={refreshing}
              progress={progress}
              selectedPairCount={selectedPairs.length}
              liveModeLocked={liveModeLocked}
            />
          </div>

          <SessionPills />
        </section>
        {lastScanNote && !restoreMessage && (
          <div className="disclaimer-banner" style={{ borderColor: "var(--gold)", color: "var(--gold2)" }}>
            {lastScanNote}
          </div>
        )}
        {restoreMessage && (
          <div className="disclaimer-banner" style={{ borderColor: "var(--blue)", color: "var(--blue2)" }}>
            {restoreMessage}
          </div>
        )}
        <StatsRow
          signals={displaySignals}
          v9Meta={v9Meta}
          apiCalls={apiCalls}
          visible={!!(v9Meta || displaySignals.length)}
        />
        <LoadingScanner
          active={scanning || autoScanning}
          title={loaderText}
          sub={loaderSub}
        />
        <div className="main-grid">
          <div className="signals-col">
            <V9ScanSummary meta={v9Meta} />
            {(v9Meta?.liveCount ?? 0) === 0 ? (
              <OpportunityRadar items={v9Meta?.radarTop ?? []} />
            ) : null}
            {!scanning && !autoScanning && !displaySignals.length && !v9Meta ? (
              <div className="empty">
                <div className="empty-icon">📡</div>
                <div className="empty-txt">
                  Select assets above, tune your filters, then hit{" "}
                  <strong style={{ color: "var(--blue2)" }}>Run scan</strong> for structured market
                  setup analysis.
                  <br />
                  <br />
                  <span style={{ color: "var(--m2)" }}>
                    V9: Live permission · Practice signals · Opportunity Radar · Why-no-signal
                  </span>
                </div>
              </div>
            ) : (
              displaySignals.map((sig, idx) => (
                <SignalCard key={sig.signalUid} sig={sig} delay={idx * 60} timeZone={timeZone} />
              ))
            )}
            <WhyNoSignalPanel
              items={v9Meta?.whyNoSignal ?? []}
              visible={(v9Meta?.liveCount ?? 0) === 0 && Boolean(v9Meta)}
            />
          </div>
          <SupportPanel signals={displaySignals} errors={marketErrors} v9Meta={v9Meta} />
        </div>
      </div>
      {rulesModalOpen && rulesState.active && !termsState.required && (
        <RulesModal
          rules={rulesState.active}
          required={rulesState.required}
          acknowledging={acknowledgingRules}
          onAcknowledge={acknowledgeRules}
          onClose={() => {
            if (!rulesState.required) setRulesModalOpen(false);
          }}
        />
      )}
      {termsState.required && termsState.active && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,12,.82)",
            zIndex: 1500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div className="ctrl" style={{ width: "min(900px, 96vw)", maxHeight: "86vh", overflow: "auto" }}>
            <div className="ctrl-title">Terms & Conditions Acceptance Required</div>
            <p style={{ fontSize: 11, color: "var(--m3)", marginBottom: 10 }}>
              Version {termsState.active.version} — {termsState.active.title}
            </p>
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 11,
                color: "var(--txt2)",
                lineHeight: 1.6,
                border: "1px solid var(--bd)",
                borderRadius: 8,
                background: "var(--p2)",
                padding: 12,
                maxHeight: 360,
                overflow: "auto",
              }}
            >
              {termsState.active.content || "Please review the latest Terms & Conditions."}
              {termsState.active.file_url ? (
                <>
                  {"\n\n"}Reference: {termsState.active.file_url}
                </>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="btn-scan"
                disabled={acceptingTerms}
                onClick={async () => {
                  setAcceptingTerms(true);
                  try {
                    const res = await fetch("/api/terms/accept", { method: "POST" });
                    const json = await res.json();
                    if (!res.ok || !json.ok) {
                      toast.error(json.error || "Could not accept terms");
                    } else {
                      toast.success("Terms accepted.");
                      setTermsState((s) => ({ ...s, required: false }));
                      if (rulesState.required && rulesState.active) {
                        setRulesModalOpen(true);
                      }
                    }
                  } catch {
                    toast.error("Could not accept terms");
                  } finally {
                    setAcceptingTerms(false);
                  }
                }}
              >
                {acceptingTerms ? "Accepting..." : "I Accept & Continue"}
              </button>
              <button
                type="button"
                className="jbtn"
                onClick={async () => {
                  const supabase = createClient();
                  await Promise.all([clearAdminSession(), supabase.auth.signOut()]);
                  router.replace("/login");
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <CapitalProtectionModal
        open={cppModalOpen}
        saving={cppSaving}
        migrationWarning={migrationWarning}
        values={cppValues}
        recovery={recovery}
        onChange={(patch) => setCppValues((s) => ({ ...s, ...patch }))}
        onSave={() => void saveCapitalPlan()}
        onClose={() => setCppModalOpen(false)}
      />
      {showLossModal && (
        <LossLimitModal
          onPracticeOnly={() => {
            updateSettings({ mode: "practice" });
            setShowLossModal(false);
          }}
          onPause={async () => {
            await fetch("/api/risk/pause", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ minutes: 30 }),
            });
            setLiveModeLocked(true);
            updateSettings({ mode: "practice" });
            setShowLossModal(false);
          }}
          onViewJournal={() => setShowLossModal(false)}
        />
      )}
    </>
  );
}
