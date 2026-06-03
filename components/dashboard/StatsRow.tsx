import type { ComputedSignal } from "@/lib/signal-engine/types";
import { resolvePermission } from "@/lib/signal-engine/permission";

export function StatsRow({
  signals,
  apiCalls,
  visible,
}: {
  signals: ComputedSignal[];
  apiCalls?: number;
  visible: boolean;
}) {
  if (!visible || !signals.length) return null;

  const allowed = signals.filter((s) => resolvePermission(s) === "TRADE ALLOWED").length;
  const observe = signals.filter((s) => resolvePermission(s) === "OBSERVE ONLY").length;
  const blocked = signals.filter((s) => resolvePermission(s) === "DO NOT TRADE").length;
  const top = signals[0];

  return (
    <div className="stats">
      <div className="sb">
        <div className="sbv" style={{ color: "var(--blue2)" }}>
          {signals.length}
        </div>
        <div className="sbl">Signals</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--bull)" }}>
          {allowed}
        </div>
        <div className="sbl">Trade Allowed</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--gold2)" }}>
          {observe}
        </div>
        <div className="sbl">Observation</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--bear)" }}>
          {blocked}
        </div>
        <div className="sbl">Do Not Trade</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 12, color: "var(--txt)" }}>
          {top ? `${top.pair} ${top.direction}` : "—"}
        </div>
        <div className="sbl">Top Setup</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 11, color: "var(--m3)" }}>
          {apiCalls ?? "—"}
        </div>
        <div className="sbl">API Calls</div>
      </div>
    </div>
  );
}
