import type { ComputedSignal } from "@/lib/signal-engine/types";
import { resolvePermission } from "@/lib/signal-engine/permission";

import type { V9ScanMeta } from "@/lib/signal-engine/v9/types";

export function SupportPanel({
  signals,
  errors = [],
  v9Meta,
}: {
  signals: ComputedSignal[];
  errors?: string[];
  v9Meta?: V9ScanMeta | null;
}) {
  if (!signals.length && !errors.length && !v9Meta) {
    return (
      <aside className="box side">
        <div className="row-title">
          <h3>🧠 V9 OPPORTUNITY SUPPORT</h3>
        </div>
        <div className="panel-list">
          <div className="panel-item">
            <div className="panel-title">No scan yet</div>
            <div className="panel-sub">
              After scanning, this panel shows top setup, all generated signals and risk blockers.
            </div>
          </div>
        </div>
      </aside>
    );
  }

  const top = signals[0];

  return (
    <aside className="box side">
      <div className="row-title">
        <h3>🧠 MARKET SUPPORT PANEL</h3>
      </div>
      <div className="panel-list">
        {top && (
          <div className="panel-item">
            <div className="panel-title">
              Top Setup: {top.pair} {top.direction}
            </div>
            <div className="panel-sub">
              {top.signalType} · {top.grade} · {top.conf}% · {top.tf}
            </div>
          </div>
        )}
        {signals.map((s) => (
          <div className="panel-item" key={s.signalUid}>
            <div className="panel-title">
              {s.pair} · {s.direction} · {s.signalType}
            </div>
            <div className="panel-sub">
              {resolvePermission(s)} · {s.grade} · {s.conf}% · gap {s.scoreGap}
              <br />
              {(s.signalReason || "").slice(0, 120)}
            </div>
          </div>
        ))}
        {errors.length > 0 && (
          <div className="panel-item">
            <div className="panel-title" style={{ color: "var(--bear)" }}>
              Data Errors
            </div>
            <div className="panel-sub">{errors.slice(0, 5).join(" · ")}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
