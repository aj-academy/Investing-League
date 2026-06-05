"use client";

import { ALL_PAIRS } from "@/lib/billing/planLimits";

const SELECTED_KEY = "til_v8_selected_pairs";

export function loadStoredPairs(allowed: string[]): string[] {
  if (typeof window === "undefined") return allowed.slice(0, 2);
  try {
    const raw = JSON.parse(localStorage.getItem(SELECTED_KEY) || "[]") as string[];
    const filtered = raw.filter((p) => allowed.includes(p));
    if (filtered.length) return filtered;
  } catch {
    /* ignore */
  }
  const defaults = ["EUR/USD", "GBP/USD"].filter((p) => allowed.includes(p));
  return defaults.length ? defaults : allowed.slice(0, Math.min(2, allowed.length));
}

export function saveStoredPairs(pairs: string[]) {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(pairs));
}

export function AssetChipGrid({
  allowedPairs,
  selected,
  disabled,
  onChange,
}: {
  allowedPairs: string[];
  selected: string[];
  disabled?: boolean;
  onChange: (pairs: string[]) => void;
}) {
  const set = new Set(selected);

  const toggle = (pair: string) => {
    if (disabled || !allowedPairs.includes(pair)) return;
    const next = new Set(selected);
    if (next.has(pair)) next.delete(pair);
    else next.add(pair);
    const arr = ALL_PAIRS.filter((p) => next.has(p));
    onChange(arr);
    saveStoredPairs(arr);
  };

  const preset = (type: "all" | "major4" | "eurgbp" | "clear") => {
    if (disabled) return;
    let next: string[] = [];
    if (type === "all") next = [...allowedPairs];
    else if (type === "major4")
      next = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF"].filter((p) =>
        allowedPairs.includes(p)
      );
    else if (type === "eurgbp")
      next = ["EUR/USD", "GBP/USD", "EUR/GBP"].filter((p) => allowedPairs.includes(p));
    onChange(next);
    saveStoredPairs(next);
  };

  return (
    <div className="box">
      <div className="row-title">
        <h3>🎯 SELECT ASSETS</h3>
        <span className="badge">{selected.length} selected</span>
      </div>
      <div className="asset-grid">
        {ALL_PAIRS.map((p) => {
          const allowed = allowedPairs.includes(p);
          return (
            <button
              key={p}
              type="button"
              className={`asset-chip ${set.has(p) ? "on" : ""}`}
              disabled={disabled || !allowed}
              onClick={() => toggle(p)}
              title={allowed ? p : `${p} — not on your plan`}
            >
              {p}
            </button>
          );
        })}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button type="button" className="jbtn" onClick={() => preset("all")}>
          All
        </button>
        <button type="button" className="jbtn" onClick={() => preset("major4")}>
          Major 4
        </button>
        <button type="button" className="jbtn" onClick={() => preset("eurgbp")}>
          EUR + GBP
        </button>
        <button type="button" className="jbtn" onClick={() => preset("clear")}>
          Clear
        </button>
      </div>
    </div>
  );
}
