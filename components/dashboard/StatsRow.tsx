import type { ComputedSignal } from "@/lib/signal-engine/types";

export function StatsRow({
  signals,
  mode,
  visible,
}: {
  signals: ComputedSignal[];
  mode: string;
  visible: boolean;
}) {
  if (!visible || !signals.length) return null;
  const calls = signals.filter((s) => s.direction === "CALL").length;
  const puts = signals.filter((s) => s.direction === "PUT").length;
  const finals = signals.filter(
    (s) => s.signalType === "STRONG FINAL" || s.signalType === "FINAL TRADE"
  ).length;
  const avgS = Math.round(signals.reduce((a, s) => a + s.score, 0) / signals.length);
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
          {calls}
        </div>
        <div className="sbl">CALL</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--bear)" }}>
          {puts}
        </div>
        <div className="sbl">PUT</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--gold)" }}>
          {avgS}
        </div>
        <div className="sbl">Avg Score</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 12, color: "var(--txt)" }}>
          {(top.pair + " " + top.direction + " " + top.signalType).slice(0, 18)}
        </div>
        <div className="sbl">Top Pick</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 11, color: "var(--m3)" }}>
          {mode === "live" ? `Live: ${finals} Final` : "Practice Mode"}
        </div>
        <div className="sbl">Source</div>
      </div>
    </div>
  );
}
