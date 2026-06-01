"use client";

import type { TickerItem } from "@/lib/market/tickerService";

export function MarketTicker({ items }: { items: TickerItem[] }) {
  const display =
    items.length > 0
      ? items
      : [{ pair: "LOADING", price: "——", chg: "", up: true, source: "cache" as const, updatedAt: "" }];

  const doubled = [...display, ...display];

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {doubled.map((ti, i) => (
          <div className="ti" key={`${ti.pair}-${i}`}>
            <span className="ti-pair">{ti.pair}</span>
            <span className="ti-p" style={{ color: ti.up ? "var(--bull)" : "var(--bear)" }}>
              {ti.price}
            </span>
            <span className="ti-c" style={{ color: ti.up ? "var(--bull)" : "var(--bear)" }}>
              {ti.chg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
