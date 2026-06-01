"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AutoRefreshOption, PlanName } from "@/lib/billing/planLimits";
import {
  autoRefreshToSeconds,
  normalizeAutoRefresh,
  pairsForAssetSelection,
} from "@/lib/billing/planLimits";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { toast } from "sonner";
import { DataProviderStatus } from "./DataProviderStatus";
import { LoadingScanner } from "./LoadingScanner";
import { MarketTicker } from "./MarketTicker";
import { RiskDisclaimerBanner } from "./RiskDisclaimerBanner";
import { ScannerControls } from "./ScannerControls";
import { SessionPills } from "./SessionPills";
import { SignalCard } from "./SignalCard";
import { StatsRow } from "./StatsRow";
import { SupportPanel } from "./SupportPanel";
import { Topbar } from "../layout/Topbar";
import type { TickerItem } from "@/lib/market/tickerService";
import { resolveTimeZone, timeZoneAbbreviation } from "@/lib/datetime";
import { readScanFromSessionCache, saveScanToSessionCache } from "@/lib/signals/scanCache";

function clientTimeZone() {
  if (typeof Intl !== "undefined") {
    return resolveTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
  return resolveTimeZone();
}

export interface ScanSettings {
  asset: string;
  timeframe: string;
  minScore: number;
  showB: boolean;
  session: string;
  autoRefresh: AutoRefreshOption;
  mode: "practice" | "live";
}

export interface PlanInfo {
  plan: PlanName;
  scansUsedToday: number;
  scansRemainingToday: number;
  dailyScanLimit: number;
}

export function DashboardClient({
  initialSettings,
  configured,
  planInfo,
}: {
  initialSettings: ScanSettings;
  configured: boolean;
  planInfo: PlanInfo;
}) {
  const [settings, setSettings] = useState<ScanSettings>({
    ...initialSettings,
    autoRefresh: normalizeAutoRefresh(
      (initialSettings as ScanSettings & { liveUpdate?: string }).liveUpdate ??
        initialSettings.autoRefresh,
      planInfo.plan
    ),
  });
  const [signals, setSignals] = useState<ComputedSignal[]>([]);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaderText, setLoaderText] = useState("SCANNING");
  const [loaderSub, setLoaderSub] = useState("");
  const [marketLive, setMarketLive] = useState(false);
  const [marketHint, setMarketHint] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [scanUsage, setScanUsage] = useState(planInfo);
  const [refreshing, setRefreshing] = useState(false);
  const [lastScanNote, setLastScanNote] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [autoScanning, setAutoScanning] = useState(false);
  const autoScanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runScanRef = useRef<(opts?: { auto?: boolean }) => Promise<void>>(async () => {});
  const [timeZone] = useState(() => clientTimeZone());
  const tzLabel = timeZoneAbbreviation(timeZone);

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

  const selectedPairs = useCallback(() => {
    try {
      return pairsForAssetSelection(planInfo.plan, settings.asset);
    } catch {
      return [];
    }
  }, [planInfo.plan, settings.asset]);

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
    if (!configured) {
      setMarketHint("Add TWELVE_DATA_API_KEY in Vercel environment variables.");
    }
  }, [configured]);

  useEffect(() => {
    return () => clearAutoSchedule();
  }, [clearAutoSchedule]);

  const runScan = useCallback(async (opts?: { auto?: boolean }) => {
    const isAuto = Boolean(opts?.auto);
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
      setLoaderText("V4 SCANNING");
      setLoaderSub("Running decision-support engine...");
    }

    let pairs: string[];
    try {
      pairs = pairsForAssetSelection(planInfo.plan, settings.asset);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pair not allowed on your plan");
      if (isAuto) setAutoScanning(false);
      else setScanning(false);
      return;
    }

    const timeframes =
      settings.timeframe === "both" ? ["both"] : [settings.timeframe];

    try {
      const res = await fetch("/api/signals/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairs,
          timeframes,
          mode: settings.mode,
          minScore: settings.minScore,
          showBSignals: settings.showB,
          sessionFilter: settings.session,
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
            setSettings((s) => ({ ...s, autoRefresh: "off" }));
          }
        } else {
          toast.error(json.error || json.message || "Scan failed");
        }
        if (isAuto) setAutoScanning(false);
        else setScanning(false);
        return;
      }
      const list = json.signals || [];
      setSignals(list);
      if (json.ticker?.length) setTicker(json.ticker);
      setMarketLive(Boolean(json.ticker?.length));
      if (list.length) {
        saveScanToSessionCache({
          ts: Date.now(),
          scanSessionId: json.scanSessionId,
          signals: list,
          ticker: json.ticker,
        });
      }
      if (json.usage) {
        setScanUsage({
          plan: json.usage.plan,
          scansUsedToday: json.usage.scansUsedToday,
          scansRemainingToday: json.usage.scansRemainingToday,
          dailyScanLimit: json.usage.dailyScanLimit,
        });
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

      const intervalSec = autoRefreshToSeconds(settings.autoRefresh);
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
    settings,
    planInfo.plan,
    clearAutoSchedule,
    scheduleAutoScan,
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
        <RiskDisclaimerBanner />
        <div className="disclaimer-banner" style={{ marginBottom: 10 }}>
          <strong>SCAN MARKET</strong> runs the V4 signal engine on live candle data.{" "}
          <strong>AUTO REFRESH</strong> re-runs the same engine on a timer (like the HTML template)
          and updates signals in real time.
        </div>
        <DataProviderStatus configured={configured} live={marketLive} hint={marketHint} />
        <MarketTicker items={ticker} />
        <ScannerControls
          plan={planInfo.plan}
          settings={settings}
          onChange={(p) => setSettings((s) => ({ ...s, ...p }))}
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
        <div className="v4-mode-note">
          <strong>V4 POWER ENGINE:</strong> Practice Mode shows all signals for signal testing
          and journal analytics. <b>Live Mode selects only the best signal per scan</b> and
          downgrades others to Watch / Correlation Risk.
        </div>
        <SessionPills />
        <StatsRow signals={signals} mode={settings.mode} visible={!!signals.length} />
        <LoadingScanner
          active={scanning || autoScanning}
          title={loaderText}
          sub={loaderSub}
        />
        <div className="sg">
          {!scanning && !signals.length ? (
            <div className="empty">
              <div className="empty-icon">📡</div>
              <div className="empty-txt">
                Configure your scanner above, then click{" "}
                <strong style={{ color: "var(--blue2)" }}>SCAN MARKET</strong> for educational
                market setup analysis.
                <br />
                <br />
                <span style={{ color: "var(--m2)" }}>
                  Strategy: Fresh Entry + EMA/WMA Trend + Pullback Safety + ATR + Journal
                  Analytics
                </span>
              </div>
            </div>
          ) : (
            <>
              {signals.length > 0 && <SupportPanel signals={signals} />}
              {signals.map((sig, idx) => (
                <SignalCard key={sig.signalUid} sig={sig} delay={idx * 60} timeZone={timeZone} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
