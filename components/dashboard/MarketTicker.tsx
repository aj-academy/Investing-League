"use client";

import { useEffect, useState } from "react";
import { PAIRS, isJpyPair } from "@/lib/utils";

type TickerItem = { pair: string; price: string; chg: string; up: boolean };

export function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([
    { pair: "LOADING", price: "——", chg: "", up: true },
  ]);

  useEffect(() => {
    const load = async () => {
      const out: TickerItem[] = [];
      for (const pair of PAIRS) {
        try {
          const res = await fetch("/api/market/candles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pair, interval: "5min", outputsize: 5 }),
          });
          const json = await res.json();
          if (!json.candles?.length) continue;
          const last = json.candles[json.candles.length - 1];
          const prev = json.candles[json.candles.length - 2];
          const chg = ((last.close - prev.close) / prev.close) * 100;
          const up = chg >= 0;
          const dp = isJpyPair(pair) ? 3 : 5;
          out.push({
            pair,
            price: last.close.toFixed(dp),
            chg: `${up ? "▲" : "▼"}${Math.abs(chg).toFixed(3)}%`,
            up,
          });
        } catch {
          /* skip */
        }
      }
      if (out.length) setItems([...out, ...out]);
    };
    load();
    const id = setInterval(load, 60000);
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
