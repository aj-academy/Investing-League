import type { ComputedSignal } from "@/lib/signal-engine/types";
import type { V9ScanMeta } from "@/lib/signal-engine/v9/types";

export function StatsRow({
  signals,
  v9Meta,
  apiCalls,
  visible,
}: {
  signals: ComputedSignal[];
  v9Meta?: V9ScanMeta | null;
  apiCalls?: number;
  visible: boolean;
}) {
  if (!visible) return null;

  const live = v9Meta?.v10LiveCount ?? v9Meta?.liveCount ?? signals.filter((s) => s.v10Layer === "LIVE").length;
  const pending =
    v9Meta?.pendingCount ?? signals.filter((s) => s.v10Layer === "PENDING_ORDER_ELIGIBLE").length;
  const practice =
    v9Meta?.practiceCount ?? signals.filter((s) => s.v10Layer === "PRACTICE").length;
  const protectedCount = v9Meta?.protectedRiskyCount ?? 0;
  const radar = v9Meta?.radarCount ?? signals.filter((s) => s.v10Layer === "RADAR").length;
  const top = signals[0];

  return (
    <div className="stats">
      <div className="sb">
        <div className="sbv" style={{ color: "var(--blue2)" }}>
          {signals.length}
        </div>
        <div className="sbl">Market Checks</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--bull)" }}>
          {live}
        </div>
        <div className="sbl">Live Trades</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--blue2)" }}>
          {pending}
        </div>
        <div className="sbl">Pending Order</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--gold2)" }}>
          {practice}
        </div>
        <div className="sbl">Practice / Watch</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 12, color: "var(--txt)" }}>
          {top ? `${top.pair} ${top.direction}` : "—"}
        </div>
        <div className="sbl">Best Ready</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 11, color: "var(--m3)" }}>
          {apiCalls ?? v9Meta?.apiCalls ?? "—"}
        </div>
        <div className="sbl">API Calls</div>
      </div>
      {radar > 0 && live === 0 && pending === 0 ? (
        <div className="sb sb-wide">
          <div className="sbv" style={{ fontSize: 10, color: "var(--m3)", lineHeight: 1.4 }}>
            Protected Risky Setups: {protectedCount}
            <br />
            <span style={{ fontSize: 9 }}>Rejected because risk was higher than quality.</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
