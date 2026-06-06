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
  const liveLabel =
    limits.liveUpdateMode === "cached_only"
      ? "Cached only"
      : limits.quoteRefreshSeconds > 0
        ? `Quote every ${limits.quoteRefreshSeconds}s`
        : "Off";

  return (
    <div
      className="ctrl"
      style={{
        marginBottom: 12,
        padding: "10px 14px",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--m3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--blue2)" }}>Current Plan: {limits.label}</strong>
        <br />
        Scans today: <strong style={{ color: "var(--txt2)" }}>{scansUsedToday}</strong> · Total
        scans: <strong style={{ color: "var(--txt2)" }}>{totalScans}</strong> · Remaining today:{" "}
        {scansRemainingToday} / {dailyScanLimit} · Pairs: {limits.allowedPairs.length}/8 · Live:{" "}
        {liveLabel}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn-scan"
          style={{ padding: "8px 14px", fontSize: 10 }}
          onClick={onRulesClick}
        >
          Platform Rules
        </button>
        <button
          type="button"
          className="btn-scan"
          style={{ padding: "8px 14px", fontSize: 10 }}
          onClick={() => {
            toast.message("Subscription billing coming soon.");
            router.push("/settings");
          }}
        >
          Upgrade to unlock all pairs
        </button>
      </div>
    </div>
  );
}
