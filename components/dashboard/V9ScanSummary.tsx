import type { V9ScanMeta } from "@/lib/signal-engine/v9/types";

export function V9ScanSummary({ meta }: { meta: V9ScanMeta | null }) {
  if (!meta) return null;

  const tradeAllowed = meta.tradeAllowedCount ?? meta.v10LiveCount ?? 0;
  const pendingOrder = meta.pendingOrderCount ?? meta.pendingCount ?? 0;
  const caution = meta.cautionCount ?? meta.practiceCount ?? 0;
  const avoid = meta.avoidCount ?? meta.radarCount ?? 0;

  return (
    <div className="v9-summary">
      <div className="v9-kicker">V10 DECISION ENGINE</div>
      <div className="v9-title">{meta.headline}</div>
      <p className="v9-sub">
        {meta.subline}
        <br />
        <strong>No trade is also a trading decision.</strong> The system protects users by rejecting
        low-quality setups.
      </p>
      {meta.weekendBlocked ? (
        <p className="v9-weekend-note">Weekend / Thin Market — Live trading blocked.</p>
      ) : null}
      <div className="v9-metrics">
        <div className="v9-metric">
          <b style={{ color: "var(--bull)" }}>{tradeAllowed}</b>
          <span>Trade Allowed</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--blue2)" }}>{pendingOrder}</b>
          <span>Pending Order</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--gold2)" }}>{caution}</b>
          <span>Caution</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--m3)" }}>{avoid}</b>
          <span>Avoid</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--txt)" }}>{meta.avgSetupQuality ?? "—"}%</b>
          <span>Avg Quality</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--m3)" }}>{meta.apiCalls}</b>
          <span>API Calls</span>
        </div>
      </div>
    </div>
  );
}
