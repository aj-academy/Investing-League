import type { V9ScanMeta } from "@/lib/signal-engine/v9/types";

export function V9ScanSummary({ meta }: { meta: V9ScanMeta | null }) {
  if (!meta) return null;

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
          <b style={{ color: "var(--bull)" }}>{meta.liveCount}</b>
          <span>Live Permission</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--gold2)" }}>{meta.practiceCount}</b>
          <span>Practice</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--blue2)" }}>{meta.radarCount}</b>
          <span>Radar</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--bear)" }}>{meta.protectedRiskyCount}</b>
          <span>Protected</span>
        </div>
        <div className="v9-metric">
          <b style={{ color: "var(--m3)" }}>{meta.apiCalls}</b>
          <span>API Calls</span>
        </div>
      </div>
    </div>
  );
}
