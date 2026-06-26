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

  const tradeAllowed =
    v9Meta?.tradeAllowedCount ??
    signals.filter((s) => s.v10Permission === "TRADE_ALLOWED").length;
  const pendingOrder =
    v9Meta?.pendingOrderCount ??
    signals.filter((s) => s.v10Permission === "PENDING_ORDER_SIGNAL").length;
  const caution =
    v9Meta?.cautionCount ??
    signals.filter((s) => s.v10Permission === "CAUTION_SIGNAL").length;
  const avoid =
    v9Meta?.avoidCount ?? signals.filter((s) => s.v10Permission === "AVOID_TRADE").length;
  const protectedCount = v9Meta?.protectedRiskyCount ?? 0;
  const top = signals[0];

  return (
    <div className="stats">
      <div className="sb">
        <div className="sbv" style={{ color: "var(--blue2)" }}>
          {signals.length}
        </div>
        <div className="sbl">Shown</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--bull)" }}>
          {tradeAllowed}
        </div>
        <div className="sbl">Trade Allowed</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--blue2)" }}>
          {pendingOrder}
        </div>
        <div className="sbl">Pending Order</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ color: "var(--gold2)" }}>
          {caution}
        </div>
        <div className="sbl">Caution</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 12, color: "var(--txt)" }}>
          {top ? `${top.pair} ${top.direction}` : "—"}
        </div>
        <div className="sbl">Best Signal</div>
      </div>
      <div className="sb">
        <div className="sbv" style={{ fontSize: 11, color: "var(--m3)" }}>
          {apiCalls ?? v9Meta?.apiCalls ?? "—"}
        </div>
        <div className="sbl">API Calls</div>
      </div>
      {avoid > 0 && tradeAllowed === 0 && pendingOrder === 0 ? (
        <div className="sb sb-wide">
          <div className="sbv" style={{ fontSize: 10, color: "var(--m3)", lineHeight: 1.4 }}>
            Avoid trades: {avoid}
            <br />
            <span style={{ fontSize: 9 }}>Protected risky setups: {protectedCount}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
