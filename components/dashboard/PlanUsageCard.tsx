"use client";

import type { PlanName } from "@/lib/billing/planLimits";
import { getPlanLimits } from "@/lib/billing/planLimits";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function PlanUsageCard({
  plan,
  scansUsedToday,
  scansRemainingToday,
  dailyScanLimit,
  totalScans,
  onRulesClick,
}: {
  plan: PlanName;
  scansUsedToday: number;
  scansRemainingToday: number;
  dailyScanLimit: number;
  totalScans: number;
  onRulesClick?: () => void;
}) {
  const router = useRouter();
  const limits = getPlanLimits(plan);
  const usedPct = dailyScanLimit > 0 ? Math.min(100, (scansUsedToday / dailyScanLimit) * 100) : 0;
  const lowQuota = scansRemainingToday <= 2 && dailyScanLimit <= 30;

  const liveLabel =
    limits.liveUpdateMode === "cached_only"
      ? "Cached"
      : limits.quoteRefreshSeconds > 0
        ? `${limits.quoteRefreshSeconds}s quotes`
        : "Off";

  return (
    <div className="scanner-plan-card">
      <div className="scanner-plan-top">
        <div className="scanner-plan-brand">
          <span className={`scanner-plan-badge plan-${plan}`}>{limits.label}</span>
          <div>
            <div className="scanner-plan-title">Daily scan quota</div>
            <div className="scanner-plan-meta">
              {limits.maxPairsPerScan} pair max · {liveLabel}
              {!limits.allowAutoScan ? " · manual scans only" : ""}
            </div>
          </div>
        </div>
        <div className="scanner-plan-actions">
          <button type="button" className="scanner-btn-ghost" onClick={onRulesClick}>
            Rules
          </button>
          <button
            type="button"
            className="scanner-btn-upgrade"
            onClick={() => {
              toast.message("Subscription billing coming soon.");
              router.push("/settings");
            }}
          >
            Upgrade
          </button>
        </div>
      </div>

      <div className="scanner-stats-row">
        <div className="scanner-stat">
          <span className="scanner-stat-val stat-blue">{scansRemainingToday}</span>
          <span className="scanner-stat-label">Left today</span>
        </div>
        <div className="scanner-stat">
          <span className="scanner-stat-val">{scansUsedToday}</span>
          <span className="scanner-stat-label">Used today</span>
        </div>
        <div className="scanner-stat">
          <span className="scanner-stat-val">{dailyScanLimit}</span>
          <span className="scanner-stat-label">Daily limit</span>
        </div>
        <div className="scanner-stat">
          <span className="scanner-stat-val stat-gold">{totalScans}</span>
          <span className="scanner-stat-label">All-time scans</span>
        </div>
      </div>

      <div className="scanner-quota-wrap">
        <div className="scanner-quota-track">
          <div
            className={`scanner-quota-fill${lowQuota ? " low" : ""}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <span className="scanner-quota-label">
          {scansUsedToday} of {dailyScanLimit} scans used
          {lowQuota && scansRemainingToday > 0 ? " · running low" : ""}
          {scansRemainingToday === 0 ? " · limit reached" : ""}
        </span>
      </div>
    </div>
  );
}
