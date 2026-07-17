"use client";

import { useState } from "react";
import type { Micro2MSignal } from "@/lib/signal-engine/micro2m/types";
import { liveFacingMicroLabel } from "@/lib/signal-engine/micro2m/labels";

function badgeClass(permission: Micro2MSignal["microPermission"], live: boolean) {
  if (permission === "2M_STRONG_MICRO") return live ? "micro2m-badge strong live" : "micro2m-badge strong";
  if (permission === "2M_MICRO_TRADE") return live ? "micro2m-badge trade live" : "micro2m-badge trade";
  if (permission === "2M_WATCH") return "micro2m-badge watch";
  return "micro2m-badge avoid";
}

function cardPermClass(permission: Micro2MSignal["microPermission"]) {
  if (permission === "2M_STRONG_MICRO") return "perm-strong";
  if (permission === "2M_MICRO_TRADE") return "perm-trade";
  if (permission === "2M_WATCH") return "perm-watch";
  return "perm-avoid";
}

function Micro2MJournalForm({
  item,
  livePresentation,
}: {
  item: Micro2MSignal;
  livePresentation: boolean;
}) {
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
          microLabel: liveFacingMicroLabel(item.microPermission, livePresentation),
          microReason: item.microReason,
          platformOpenQuote: openQuote || null,
          platformCloseQuote: closeQuote || null,
          result,
          notes,
          livePresentation,
          scanMode: livePresentation ? "live" : "practice",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || "Save failed");
      } else {
        setMsg(json.warning || "Trade logged. Update quotes/result after the 2-minute expiry.");
      }
    } catch {
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="micro2m-journal">
      {livePresentation ? (
        <div className="micro2m-take">TAKE THIS 2M LIVE TRADE · 2-minute expiry on platform</div>
      ) : null}
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
        {saving ? "Saving…" : livePresentation ? "Update 2M LIVE journal" : "Journal 2M trade"}
      </button>
      {msg ? <div className="micro2m-line">{msg}</div> : null}
    </div>
  );
}

export function Micro2MSection({
  items,
  riskWarning,
  visible,
  livePresentation = false,
}: {
  items: Micro2MSignal[];
  riskWarning?: string | null;
  visible: boolean;
  livePresentation?: boolean;
}) {
  if (!visible) return null;

  const takeable = items.filter(
    (i) => i.microPermission === "2M_MICRO_TRADE" || i.microPermission === "2M_STRONG_MICRO",
  );

  return (
    <div className={`micro2m-wrap${livePresentation ? " live-mode" : ""}`}>
      <div className="micro2m-head">
        <h3>{livePresentation ? "2M LIVE TRADE SIGNALS" : "2M MICRO SIGNALS"}</h3>
        <p className="micro2m-sub">
          {livePresentation
            ? "Real takeable 2-minute live trades from 2-minute candles. Take only green/cyan badges. Separate from 5-min/15-min V9 LIVE win rate."
            : "Short-term 2-minute direction candidates. When Expiry is 2-min, signals are scored from real 2-minute candles. Separate from V9 LIVE permission."}
        </p>
      </div>

      {livePresentation && takeable.length > 0 ? (
        <div className="micro2m-live-banner">
          {takeable.length} takeable 2M LIVE signal(s) — place on platform with 2-minute expiry only
        </div>
      ) : null}

      {riskWarning ? <div className="micro2m-risk">{riskWarning}</div> : null}

      {!items.length ? (
        <p className="micro2m-empty">
          No 2M candidates from this scan. Wait for stronger readiness (70%+) and aligned candles.
        </p>
      ) : (
        <div className="micro2m-grid">
          {items.map((item) => {
            const label = liveFacingMicroLabel(item.microPermission, livePresentation);
            const takeableCard =
              item.microPermission === "2M_MICRO_TRADE" ||
              item.microPermission === "2M_STRONG_MICRO";
            return (
              <div
                className={`micro2m-card ${cardPermClass(item.microPermission)}${item.isBest ? " best" : ""}${takeableCard && livePresentation ? " takeable" : ""}`}
                key={item.id}
              >
                {item.isBest ? (
                  <div className="micro2m-best">
                    {livePresentation ? "BEST 2M LIVE SETUP" : "BEST 2M MICRO SETUP"}
                  </div>
                ) : null}
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
                <div className={badgeClass(item.microPermission, livePresentation)}>{label}</div>
                {takeableCard && livePresentation ? (
                  <div className="micro2m-live-ok">✅ You may take this as a real 2-minute live trade</div>
                ) : null}
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
                <div className="micro2m-warn">
                  {livePresentation
                    ? "2M LIVE path — not counted in 5-min/15-min V9 LIVE win rate"
                    : "Not V9 LIVE trade permission"}
                </div>
                <Micro2MJournalForm item={item} livePresentation={livePresentation} />
              </div>
            );
          })}
        </div>
      )}

      <p className="micro2m-footer">
        {livePresentation
          ? "Take only STRONG 2M LIVE TRADE or 2M LIVE TRADE badges. Use fixed small amount, stop after 2 losses, and update journal after expiry."
          : "2M Micro is a short-term direction strategy. It is separate from V9 LIVE trade permission. Use fixed small amount, avoid recovery trades, and journal every trade."}
      </p>
    </div>
  );
}
