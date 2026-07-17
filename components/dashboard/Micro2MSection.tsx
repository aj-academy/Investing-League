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
          entryTime: item.entryTime,
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
        <div className="micro2m-take">TAKE NOW · Platform expiry must be 2 minutes</div>
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
        {saving ? "Saving…" : livePresentation ? "Update 2M journal" : "Journal 2M trade"}
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
        <h3>
          {livePresentation
            ? takeable.length > 0
              ? "2M LIVE · TRADE ALLOWED SIGNALS"
              : "2M LIVE · NO TRADE YET (WATCH ONLY)"
            : "2M MICRO SIGNALS"}
        </h3>
        <p className="micro2m-sub">
          {livePresentation
            ? "Takeable 2-minute live trades. Look for TRADE ALLOWED badges, then enter at the shown Entry time with 2-minute expiry on your platform."
            : "Short-term 2-minute direction candidates from 2-minute candles. Separate from 5-min/15-min V9 LIVE."}
        </p>
      </div>

      {livePresentation && takeable.length > 0 ? (
        <div className="micro2m-live-banner">
          {takeable.length} TRADE ALLOWED signal(s) — enter at listed Entry time · 2-minute expiry only
        </div>
      ) : livePresentation ? (
        <div className="micro2m-risk">
          No TRADE ALLOWED cards yet. Readiness must be 70%+ with aligned candle. Current cards are
          Watch/Avoid only — do not place a real trade.
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

                {takeableCard && livePresentation ? (
                  <div className="micro2m-allowed">✅ 2M TRADE ALLOWED</div>
                ) : null}
                <div className={badgeClass(item.microPermission, livePresentation)}>{label}</div>

                <div className="micro2m-entry-banner">
                  <div className="micro2m-entry-label">2M ENTRY TIME</div>
                  <div className="micro2m-entry-value">{item.entryTime || "—"}</div>
                  <div className="micro2m-entry-sub">
                    Expiry at {item.expTime || "Entry + 2 min"} · Platform expiry = 2 minutes
                  </div>
                </div>

                <div className="micro2m-times">
                  <div>
                    <span>Entry</span>
                    <b>{item.entryTime || "—"}</b>
                  </div>
                  <div>
                    <span>Expiry</span>
                    <b>{item.expTime || "2 min"}</b>
                  </div>
                  <div>
                    <span>Price</span>
                    <b>{item.price || "—"}</b>
                  </div>
                </div>

                {takeableCard && livePresentation ? (
                  <div className="micro2m-live-ok">
                    Place CALL/PUT on platform at Entry time · set expiry to 2 minutes
                  </div>
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
                <div className="micro2m-expiry">Platform expiry: 2 minutes only</div>
                <div className="micro2m-warn">
                  {livePresentation
                    ? "2M TRADE ALLOWED path — not counted in 5-min/15-min V9 LIVE win rate"
                    : "Not 5-min/15-min V9 LIVE permission"}
                </div>
                <Micro2MJournalForm item={item} livePresentation={livePresentation} />
              </div>
            );
          })}
        </div>
      )}

      <p className="micro2m-footer">
        {livePresentation
          ? "Take only cards with ✅ 2M TRADE ALLOWED. Use fixed small amount, stop after 2 losses, journal after expiry."
          : "2M Micro is separate from V9 LIVE. Use fixed small amount and journal every trade."}
      </p>
    </div>
  );
}
