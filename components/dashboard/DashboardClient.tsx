"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveUpdateOption } from "@/lib/billing/planLimits";
import type { PlanName } from "@/lib/billing/planLimits";
import { defaultLiveUpdateForPlan, pairsForAssetSelection } from "@/lib/billing/planLimits";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { toast } from "sonner";
import { DataProviderStatus } from "./DataProviderStatus";
import { LoadingScanner } from "./LoadingScanner";
import { MarketTicker } from "./MarketTicker";
import { PlanUsageCard } from "./PlanUsageCard";
import { RiskDisclaimerBanner } from "./RiskDisclaimerBanner";
import { ScannerControls } from "./ScannerControls";
import { SessionPills } from "./SessionPills";
import { SignalCard } from "./SignalCard";
import { StatsRow } from "./StatsRow";
import { SupportPanel } from "./SupportPanel";
import { Topbar } from "../layout/Topbar";
import type { TickerItem } from "@/lib/market/tickerService";

export interface ScanSettings {
  asset: string;
  timeframe: string;
  minScore: number;
  showB: boolean;
  session: string;
  liveUpdate: LiveUpdateOption;
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
    liveUpdate: initialSettings.liveUpdate || defaultLiveUpdateForPlan(planInfo.plan),
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
  const tickerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const refreshTicker = useCallback(async () => {
    const pairs = selectedPairs();
    if (!pairs.length) return;
    if (settings.liveUpdate === "off") return;

    try {
      const res = await fetch("/api/market/ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairs }),
      });
      const json = await res.json();
      if (res.ok && json.items?.length) {
        setTicker(json.items);
        setMarketLive(true);
        setMarketHint(null);
      } else if (!res.ok) {
        setMarketHint(json.error || "Market data unavailable");
        if (/cached/i.test(String(json.error))) {
          setMarketLive(false);
        }
      }
    } catch {
      setMarketHint("Could not load market data.");
    }
  }, [selectedPairs, settings.liveUpdate]);

  const reloadLastScan = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/signals/latest");
      const json = await res.json();
      if (applyLatestScan(json)) {
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
    fetch("/api/signals/latest")
      .then((r) => r.json())
      .then((json) => {
        applyLatestScan(json);
      })
      .catch(() => {
        /* no latest scan */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  useEffect(() => {
    if (!configured) {
      setMarketHint("Add TWELVE_DATA_API_KEY in Vercel environment variables.");
      return;
    }
    if (settings.liveUpdate === "off") return;
    refreshTicker();
  }, [configured, settings.liveUpdate, refreshTicker]);

  useEffect(() => {
    if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    const sec =
      settings.liveUpdate === "cached_only" || settings.liveUpdate === "off"
        ? 0
        : Number(settings.liveUpdate);
    if (sec > 0) {
      tickerTimerRef.current = setInterval(refreshTicker, sec * 1000);
    }
    return () => {
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    };
  }, [settings.liveUpdate, refreshTicker]);

  const runScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setProgress(0);
    setSignals([]);
    setRestoreMessage(null);
    setLoaderText("V4 SCANNING");
    setLoaderSub("Running decision-support engine...");

    let pairs: string[];
    try {
      pairs = pairsForAssetSelection(planInfo.plan, settings.asset);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pair not allowed on your plan");
      setScanning(false);
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
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "PLAN_LIMIT") {
          toast.error(json.message || "Plan limit reached");
        } else if (json.code === "DAILY_SCAN_LIMIT") {
          toast.error(json.message || "Daily scan limit reached");
        } else {
          toast.error(json.error || json.message || "Scan failed");
        }
        setScanning(false);
        return;
      }
      const list = json.signals || [];
      setSignals(list);
      if (json.ticker?.length) setTicker(json.ticker);
      setMarketLive(Boolean(json.ticker?.length));
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
      if (json.journalSaved > 0) {
        toast.success(json.message);
      } else if (list.length > 0) {
        toast.success(`Scan complete — ${list.length} setup(s) on screen`);
      } else {
        toast.message(json.message || "Scan finished — adjust filters or check market data");
      }
    } catch {
      toast.error("Scan request failed");
    } finally {
      setScanning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [scanning, settings, planInfo.plan]);

  return (
    <>
      <Topbar scansToday={scanUsage.scansUsedToday} live={marketLive} />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <div className="disclaimer-banner" style={{ marginBottom: 10 }}>
          <strong>SCAN MARKET</strong> generates a new signal decision using candle data and saves
          it to your journal. <strong>LIVE PRICE UPDATE</strong> only refreshes visible market
          prices — it does not run the signal engine or create journal entries. Your plan controls
          how many pairs and timeframes you can scan. Market data is shared through secure server
          cache to reduce unnecessary provider usage.
        </div>
        <PlanUsageCard
          plan={scanUsage.plan}
          scansUsedToday={scanUsage.scansUsedToday}
          scansRemainingToday={scanUsage.scansRemainingToday}
          dailyScanLimit={scanUsage.dailyScanLimit}
        />
        <DataProviderStatus configured={configured} live={marketLive} hint={marketHint} />
        <MarketTicker items={ticker} />
        <ScannerControls
          plan={planInfo.plan}
          settings={settings}
          onChange={(p) => setSettings((s) => ({ ...s, ...p }))}
          onScan={runScan}
          onRefreshPrices={async () => {
            setRefreshing(true);
            await refreshTicker();
            setRefreshing(false);
            toast.success("Prices refreshed");
          }}
          onReloadLastScan={reloadLastScan}
          scanning={scanning}
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
        <LoadingScanner active={scanning} title={loaderText} sub={loaderSub} />
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
                <SignalCard key={sig.signalUid} sig={sig} delay={idx * 60} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
