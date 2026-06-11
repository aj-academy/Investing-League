"use client";

import { toast } from "sonner";

const SELECTED_KEY = "til_v8_selected_pairs";

const PAIR_SHORT: Record<string, { base: string; quote: string }> = {
  "EUR/USD": { base: "EUR", quote: "USD" },
  "GBP/USD": { base: "GBP", quote: "USD" },
  "USD/JPY": { base: "USD", quote: "JPY" },
  "USD/CHF": { base: "USD", quote: "CHF" },
  "AUD/USD": { base: "AUD", quote: "USD" },
  "USD/CAD": { base: "USD", quote: "CAD" },
  "NZD/USD": { base: "NZD", quote: "USD" },
  "EUR/GBP": { base: "EUR", quote: "GBP" },
};

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
  maxPairsPerScan = 8,
  onChange,
}: {
  allowedPairs: string[];
  selected: string[];
  disabled?: boolean;
  maxPairsPerScan?: number;
  onChange: (pairs: string[]) => void;
}) {
  const set = new Set(selected);
  const cap = Math.max(1, maxPairsPerScan);

  const applySelection = (next: string[]) => {
    const trimmed = next.slice(0, cap);
    onChange(trimmed);
    saveStoredPairs(trimmed);
  };

  const toggle = (pair: string) => {
    if (disabled || !allowedPairs.includes(pair)) return;
    const next = new Set(selected);
    if (next.has(pair)) next.delete(pair);
    else if (next.size >= cap) {
      toast.message(`Your plan allows up to ${cap} pair(s) per scan.`);
      return;
    } else next.add(pair);
    applySelection(allowedPairs.filter((p) => next.has(p)));
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
    applySelection(next);
  };

  return (
    <div className="scanner-assets">
      <div className="scanner-assets-head">
        <div>
          <h3 className="scanner-assets-title">Select assets</h3>
          <p className="scanner-assets-sub">Tap pairs to include in this scan</p>
        </div>
        <span className="scanner-assets-badge">
          {selected.length} / {cap} selected
        </span>
      </div>

      <div className="asset-grid asset-grid-enhanced">
        {allowedPairs.map((p) => {
          const on = set.has(p);
          const parts = PAIR_SHORT[p];
          return (
            <button
              key={p}
              type="button"
              className={`asset-chip asset-chip-enhanced${on ? " on" : ""}`}
              disabled={disabled}
              onClick={() => toggle(p)}
              title={p}
            >
              {on && <span className="asset-chip-check">✓</span>}
              {parts ? (
                <span className="asset-chip-pair">
                  <span className="asset-chip-base">{parts.base}</span>
                  <span className="asset-chip-slash">/</span>
                  <span className="asset-chip-quote">{parts.quote}</span>
                </span>
              ) : (
                p
              )}
            </button>
          );
        })}
      </div>

      {allowedPairs.length > 1 && (
        <div className="scanner-preset-row">
          <button type="button" className="scanner-preset-btn" onClick={() => preset("all")}>
            All ({allowedPairs.length})
          </button>
          {allowedPairs.length >= 4 && (
            <button type="button" className="scanner-preset-btn" onClick={() => preset("major4")}>
              Major 4
            </button>
          )}
          {["EUR/USD", "GBP/USD", "EUR/GBP"].filter((p) => allowedPairs.includes(p)).length >= 2 && (
            <button type="button" className="scanner-preset-btn" onClick={() => preset("eurgbp")}>
              EUR + GBP
            </button>
          )}
          <button type="button" className="scanner-preset-btn muted" onClick={() => preset("clear")}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
