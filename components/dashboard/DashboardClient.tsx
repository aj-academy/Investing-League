"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComputedSignal } from "@/lib/signal-engine/types";
import { PAIRS } from "@/lib/utils";
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

export interface ScanSettings {
  asset: string;
  timeframe: string;
  minScore: number;
  showB: boolean;
  session: string;
  autoRefresh: number;
  mode: "practice" | "live";
}

export function DashboardClient({
  initialSettings,
  connected,
  usageCount,
  isDemo = false,
}: {
  initialSettings: ScanSettings;
  connected: boolean;
  usageCount: number;
  isDemo?: boolean;
}) {
  const [settings, setSettings] = useState<ScanSettings>(initialSettings);
  const [signals, setSignals] = useState<ComputedSignal[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaderText, setLoaderText] = useState("SCANNING");
  const [loaderSub, setLoaderSub] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setProgress(0);
    setSignals([]);
    setLoaderText("V4 SCANNING");
    setLoaderSub("Running decision-support engine...");

    const pairs = settings.asset === "all" ? [...PAIRS] : [settings.asset];
    const timeframes =
      settings.timeframe === "both" ? ["5min", "15min"] : [settings.timeframe];

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
        toast.error(json.error || "Scan failed");
        setScanning(false);
        return;
      }
      setSignals(json.signals || []);
      setProgress(100);
      toast.success(`Scan complete — ${json.signals?.length || 0} signals`);
    } catch {
      toast.error("Scan request failed");
    } finally {
      setScanning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [scanning, settings]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (settings.autoRefresh > 0 && !scanning) {
      timerRef.current = setTimeout(runScan, settings.autoRefresh * 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [settings.autoRefresh, signals, scanning, runScan]);

  return (
    <>
      <Topbar usageCount={usageCount} isDemo={isDemo} />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <DataProviderStatus connected={connected} demo={isDemo} />
        <MarketTicker />
        <ScannerControls
          settings={settings}
          onChange={(p) => setSettings((s) => ({ ...s, ...p }))}
          onScan={runScan}
          scanning={scanning}
          progress={progress}
        />
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
