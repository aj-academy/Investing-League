"use client";

import { useState } from "react";
import type { Micro2MSignal } from "@/lib/signal-engine/micro2m/types";

function badgeClass(permission: Micro2MSignal["microPermission"]) {
  if (permission === "2M_STRONG_MICRO") return "micro2m-badge strong";
  if (permission === "2M_MICRO_TRADE") return "micro2m-badge trade";
  if (permission === "2M_WATCH") return "micro2m-badge watch";
  return "micro2m-badge avoid";
}

function cardPermClass(permission: Micro2MSignal["microPermission"]) {
  if (permission === "2M_STRONG_MICRO") return "perm-strong";
  if (permission === "2M_MICRO_TRADE") return "perm-trade";
  if (permission === "2M_WATCH") return "perm-watch";
  return "perm-avoid";
}

function Micro2MJournalForm({ item }: { item: Micro2MSignal }) {
  const [openQuote, setOpenQuote] = useState("");
  const [closeQuote, setCloseQuote] = useState("");
  const [result, setResult] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canJournal =
    item.microPermission === "2M_MICRO_TRADE" || item.microPermission === "2M_STRONG_MICRO";

  if (!canJournal) return null;

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/journal/micro2m", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: item.pair,
          direction: item.direction,
          sourceTf: item.sourceTf,
          sourceLayer: item.sourceLayer,
          sourceSignalUid: item.sourceSignalUid,
          grade: item.grade,
          conf: item.conf,
          score: item.score,
          microReadiness: item.microReadiness,
          microPermission: item.microPermission,
          microLabel: item.microLabel,
          microReason: item.microReason,
          platformOpenQuote: openQuote || null,
          platformCloseQuote: closeQuote || null,
          result,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || "Save failed");
      } else {
        setMsg(json.warning || "2M trade saved to journal (separate from V9 LIVE).");
      }
    } catch {
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="micro2m-journal">
      <input
        type="text"
        placeholder="Platform open quote"
        value={openQuote}
        onChange={(e) => setOpenQuote(e.target.value)}
      />
      <input
        type="text"
        placeholder="Platform close quote"
        value={closeQuote}
        onChange={(e) => setCloseQuote(e.target.value)}
      />
      <select value={result} onChange={(e) => setResult(e.target.value)}>
        <option value="Pending">Pending</option>
        <option value="Win">Win</option>
        <option value="Loss">Loss</option>
        <option value="Refund">Refund</option>
      </select>
      <input
        type="text"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button type="button" className="btn btn-sm" disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Journal 2M trade"}
      </button>
      {msg ? <div className="micro2m-line">{msg}</div> : null}
    </div>
  );
}

export function Micro2MSection({
  items,
  riskWarning,
  visible,
}: {
  items: Micro2MSignal[];
  riskWarning?: string | null;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="micro2m-wrap">
      <div className="micro2m-head">
        <h3>2M MICRO SIGNALS</h3>
        <p className="micro2m-sub">
          Short-term 2-minute direction candidates. When Expiry is 2-min, signals are scored from
          real 2-minute candles (built from 1-minute data). Separate from V9 LIVE permission.
        </p>
      </div>

      {riskWarning ? <div className="micro2m-risk">{riskWarning}</div> : null}

      {!items.length ? (
        <p className="micro2m-empty">No 2M Micro candidates from this scan.</p>
      ) : (
        <div className="micro2m-grid">
          {items.map((item) => (
            <div
              className={`micro2m-card ${cardPermClass(item.microPermission)}${item.isBest ? " best" : ""}`}
              key={item.id}
            >
              {item.isBest ? <div className="micro2m-best">BEST 2M MICRO SETUP</div> : null}
              <div className="micro2m-top">
                <div>
                  <div className="micro2m-pair">
                    {item.pair} {item.direction}
                  </div>
                  <div className="micro2m-meta">
                    Source {item.sourceTf} · Grade {item.grade} · Conf {item.conf}%
                  </div>
                </div>
                <div className="micro2m-ready">{item.microReadiness}%</div>
              </div>
              <div className={badgeClass(item.microPermission)}>{item.microLabel}</div>
              <div className="micro2m-line">
                Candle: {item.candleAligned ? "Aligned" : "Not aligned"} · body{" "}
                {Math.round(item.candleBodyRatio)}%
                {item.isDoji ? " · Doji" : ""}
              </div>
              <div className="micro2m-line">
                1m: {item.oneMinuteStatus}
                {item.oneMinuteNote ? ` — ${item.oneMinuteNote}` : ""}
              </div>
              <p className="micro2m-reason">{item.microReason}</p>
              <p className="micro2m-action">
                <strong>Action:</strong> {item.microAction}
              </p>
              <div className="micro2m-expiry">Expiry: {item.expiryLabel} only</div>
              <div className="micro2m-warn">Not V9 LIVE trade permission</div>
              <Micro2MJournalForm item={item} />
            </div>
          ))}
        </div>
      )}

      <p className="micro2m-footer">
        2M Micro is a short-term direction strategy. It is separate from V9 LIVE trade permission. Use
        fixed small amount, avoid recovery trades, and journal every trade.
      </p>
    </div>
  );
}
