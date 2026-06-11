"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession } from "@/lib/auth/clearAdminSession";
import { createClient } from "@/lib/supabase/client";
import type { AutoRefreshOption, PlanName } from "@/lib/billing/planLimits";
import {
  autoRefreshToSeconds,
  normalizeAutoRefresh,
} from "@/lib/billing/planLimits";
import type { MinGradeFilter } from "@/lib/signal-engine/permission";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { playScanAlerts } from "@/lib/sound/signalAlerts";
import { toast } from "sonner";
import { AssetChipGrid, loadStoredPairs } from "./AssetChipGrid";
import { PlanUsageCard } from "./PlanUsageCard";
import { RulesModal } from "@/components/rules/RulesModal";
import { LoadingScanner } from "./LoadingScanner";
import { MarketTicker } from "./MarketTicker";
import { ScannerControls } from "./ScannerControls";
import { SessionPills } from "./SessionPills";
import { SignalCard } from "./SignalCard";
import { StatsRow } from "./StatsRow";
import { SupportPanel } from "./SupportPanel";
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

export interface ScanSettings {
  timeframe: string;
  minGrade: MinGradeFilter;
  minScore: number;
  dailyTradeLimit: number;
  session: string;
  autoRefresh: AutoRefreshOption;
  mode: "practice" | "live";
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
  const serverDefaults = useMemo<ScanSettings>(
    () => ({
      ...initialSettings,
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
      return filtered.length ? filtered : loadStoredPairs(allowedPairs);
    });
  }, [allowedPairs]);

  const applyLatestScan = useCallback((json: {
    signals?: ComputedSignal[];
    ticker?: TickerItem[];
    message?: string;
    hasLatest?: boolean;
  }) => {
    if (json.signals?.length) {
      setSignals(json.signals);
      if (json.ticker?.length) setTicker(json.ticker);
      setRestoreMessage(json.message || null);
      return true;
    }
    return false;
  }, []);

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
        saveScanToSessionCache({
          ts: Date.now(),
          scanSessionId: json.scanSessionId,
          signals: json.signals || [],
          ticker: json.ticker,
        });
        toast.success(json.message || "Last scan loaded");
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
    if (cached?.signals?.length) {
      setSignals(cached.signals);
      if (cached.ticker?.length) setTicker(cached.ticker);
      setRestoreMessage("Restored your last scan from this browser session.");
    }

    fetch("/api/signals/latest")
      .then((r) => r.json())
      .then((json) => {
        if (hasScannedRef.current) return;
        if (applyLatestScan(json)) {
          saveScanToSessionCache({
            ts: Date.now(),
            scanSessionId: json.scanSessionId,
            signals: json.signals || [],
            ticker: json.ticker,
          });
        }
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
    if (scanning || autoScanning) return;

    if (isAuto) {
      setAutoScanning(true);
      setLoaderText("AUTO REFRESH");
      setLoaderSub("Updating live market setups...");
    } else {
      setScanning(true);
      setProgress(0);
      setSignals([]);
      setRestoreMessage(null);
      setMarketErrors([]);
      setLoaderText("V8 SCANNING");
      setLoaderSub("Running decision-support engine...");
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
        } else {
          toast.error(json.error || json.message || "Scan failed");
        }
        if (isAuto) setAutoScanning(false);
        else setScanning(false);
        return;
      }
      hasScannedRef.current = true;
      const list = json.signals || [];
      setSignals(list);
      if (json.ticker?.length) setTicker(json.ticker);
      setMarketLive(Boolean(json.ticker?.length));
      setApiCalls(json.usage?.providerCalls);
      setMarketErrors(json.marketErrors || []);
      if (list.length) {
        saveScanToSessionCache({
          ts: Date.now(),
          scanSessionId: json.scanSessionId,
          signals: list,
          ticker: json.ticker,
        });
        playScanAlerts(list);
      }
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
            ? `Showing ${list.length} setup(s). ${json.journalSaved ?? 0} saved to journal.`
            : null
      );
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
        <MarketTicker items={ticker} />
        <AssetChipGrid
          allowedPairs={allowedPairs}
          selected={selectedPairs}
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
          scanning={scanning || autoScanning}
          refreshing={refreshing}
          progress={progress}
        />
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
        <div className="v8-mode-note">
          <strong>V8 DECISION ENGINE:</strong> Grade is setup quality. The big permission box is
          what matters: <b>TRADE ALLOWED</b>, <b>OBSERVE ONLY</b>, or <b>DO NOT TRADE</b>. Practice
          shows all filtered setups; Live keeps the best signal per scan.
        </div>
        <SessionPills />
        <StatsRow signals={signals} apiCalls={apiCalls} visible={!!signals.length} />
        <LoadingScanner
          active={scanning || autoScanning}
          title={loaderText}
          sub={loaderSub}
        />
        <div className="main-grid">
          <div className="signals-col">
            {!scanning && !autoScanning && !signals.length ? (
              <div className="empty">
                <div className="empty-icon">📡</div>
                <div className="empty-txt">
                  Select assets above, configure filters, then click{" "}
                  <strong style={{ color: "var(--blue2)" }}>SCAN SELECTED</strong> for educational
                  market setup analysis.
                  <br />
                  <br />
                  <span style={{ color: "var(--m2)" }}>
                    V8: Permission box · Min Grade · Sound alerts · Journal autosave
                  </span>
                </div>
              </div>
            ) : (
              signals.map((sig, idx) => (
                <SignalCard key={sig.signalUid} sig={sig} delay={idx * 60} timeZone={timeZone} />
              ))
            )}
          </div>
          <SupportPanel signals={signals} errors={marketErrors} />
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
    </>
  );
}
