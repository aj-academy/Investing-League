import type { V9WhyItem } from "@/lib/signal-engine/v9/types";

export function WhyNoSignalPanel({ items, visible }: { items: V9WhyItem[]; visible: boolean }) {
  if (!visible || !items.length) return null;

  return (
    <div className="why-panel">
      <h3 className="why-panel-title">Why No Live Signal?</h3>
      <p className="why-panel-sub">
        The engine is filtering the market — not failing. Analysis for discipline and journaling
        only; no profit guarantee.
      </p>
      <div className="why-list">
        {items.map((item) => (
          <div className="why-item" key={`${item.pair}-${item.direction}-${item.reason}`}>
            <div className="why-title">
              {item.pair} {item.direction}
            </div>
            <div className="why-reason">{item.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
