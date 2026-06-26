import type { V9RadarItem } from "@/lib/signal-engine/v9/types";

function layerLabel(layer: string) {
  if (layer === "PENDING_ORDER_ELIGIBLE") return "Pending Order Eligible";
  if (layer === "LIVE") return "Live Trade Permission";
  if (layer === "PRACTICE") return "Practice Only — Demo / Observation";
  return "Setup Forming";
}

export function OpportunityRadar({ items }: { items: V9RadarItem[] }) {
  if (!items.length) return null;

  return (
    <div className="radar-wrap">
      <div className="radar-head">
        <h3>📡 OPPORTUNITY RADAR</h3>
        <p className="radar-note">Closest setups ranked by readiness. Only LIVE has trade permission.</p>
      </div>
      <div className="radar-grid">
        {items.map((item) => {
          const cls =
            item.v9Layer === "LIVE"
              ? "live"
              : item.v9Layer === "PRACTICE"
                ? "practice"
                : "blocked";
          const color =
            item.v9Layer === "LIVE"
              ? "var(--bull)"
              : item.v9Layer === "PRACTICE"
                ? "var(--gold2)"
                : "var(--blue2)";
          return (
            <div className={`radar-card ${cls}`} key={`${item.pair}-${item.direction}-${item.tf}`}>
              <div className="radar-top">
                <div className="radar-pair">
                  {item.pair} {item.direction}
                </div>
                <div className="radar-ready" style={{ color }}>
                  {item.readiness}% Ready
                </div>
              </div>
              <div className="radar-bar">
                <div
                  className="radar-fill"
                  style={{ width: `${item.readiness}%`, background: color }}
                />
              </div>
              <p className="radar-reason">
                <strong>
                  {item.tf} · {item.grade} · {item.conf}%
                </strong>
                <br />
                {item.blocker}
                <br />
                <span style={{ color: "var(--m3)" }}>{item.nextCondition}</span>
              </p>
              <span className={`layer-chip ${item.v9Layer.toLowerCase()}`}>
                {layerLabel(item.v9Layer)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
