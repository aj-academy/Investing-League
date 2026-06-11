"use client";

import type { TickerItem } from "@/lib/market/tickerService";

export function MarketTicker({ items, live }: { items: TickerItem[]; live?: boolean }) {
  const hasData = items.length > 0;
  const display = hasData
    ? items
    : [{ pair: "AWAITING SCAN", price: "—", chg: "Run scan for prices", up: true, source: "cache" as const, updatedAt: "" }];

  const doubled = [...display, ...display];

  return (
    <div className={`scanner-ticker${hasData ? " has-data" : ""}`}>
      <div className="scanner-ticker-label">
        <span className={`scanner-live-dot${live || hasData ? " on" : ""}`} />
        Live quotes
      </div>
      <div className="ticker scanner-ticker-track">
        <div className="ticker-inner">
          {doubled.map((ti, i) => (
            <div className="ti scanner-ti" key={`${ti.pair}-${i}`}>
              <span className="ti-pair">{ti.pair}</span>
              <span className="ti-p" style={{ color: ti.up ? "var(--bull)" : "var(--bear)" }}>
                {ti.price}
              </span>
              {ti.chg && (
                <span className="ti-c" style={{ color: ti.up ? "var(--bull)" : "var(--bear)" }}>
                  {ti.chg}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
