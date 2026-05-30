"use client";

import { useEffect, useState } from "react";

type TickerItem = { pair: string; price: string; chg: string; up: boolean };

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([
    { pair: "LOADING", price: "——", chg: "", up: true },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/market/ticker");
        const json = await res.json();
        if (res.ok && json.items?.length) {
          setItems([...json.items, ...json.items]);
        }
      } catch {
        /* keep previous / loading state */
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ticker">
      <div className="ticker-inner">
        {items.map((ti, i) => (
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
