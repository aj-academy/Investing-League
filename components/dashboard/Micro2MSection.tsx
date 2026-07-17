"use client";

import { useState } from "react";
import type { Micro2MSignal } from "@/lib/signal-engine/micro2m/types";
import { liveFacingMicroLabel } from "@/lib/signal-engine/micro2m/labels";

function isTakeable(item: Micro2MSignal) {
  return (
    item.microPermission === "2M_MICRO_TRADE" || item.microPermission === "2M_STRONG_MICRO"
  );
}

function decisionLabel(item: Micro2MSignal): string {
  if (item.microPermission === "2M_STRONG_MICRO") return "TAKE TRADE";
  if (item.microPermission === "2M_MICRO_TRADE") return "TAKE TRADE";
  if (item.microPermission === "2M_WATCH") return "WAIT — DO NOT TRADE";
  return "SKIP — DO NOT TRADE";
}

function Micro2MJournalForm({ item }: { item: Micro2MSignal }) {
  const [openQuote, setOpenQuote] = useState("");
  const [closeQuote, setCloseQuote] = useState("");
  const [result, setResult] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isTakeable(item)) return null;

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
          microLabel: liveFacingMicroLabel(item.microPermission, true),
          microReason: item.microReason,
          entryTime: item.entryTime,
          platformOpenQuote: openQuote || null,
          platformCloseQuote: closeQuote || null,
          result,
          notes,
          livePresentation: true,
          scanMode: "live",
        }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json.error || "Save failed");
      else setMsg(json.warning || "Saved. Update result after 2-minute expiry.");
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
        {saving ? "Saving…" : "Update journal"}
      </button>
      {msg ? <div className="micro2m-line">{msg}</div> : null}
    </div>
  );
}

function TakeCard({ item }: { item: Micro2MSignal }) {
  return (
    <div className="micro2m-card takeable">
      {item.isBest ? <div className="micro2m-best">BEST 2-MINUTE SETUP</div> : null}
      <div className="micro2m-decision take">{decisionLabel(item)}</div>
      <div className="micro2m-top">
        <div>
          <div className="micro2m-pair">
            {item.pair} {item.direction}
          </div>
          <div className="micro2m-meta">
            Ready {item.microReadiness}% · Grade {item.grade} · Source {item.sourceTf}
          </div>
        </div>
        <div className="micro2m-ready">{item.microReadiness}%</div>
      </div>

      <div className="micro2m-entry-banner">
        <div className="micro2m-entry-label">ENTER AT THIS TIME</div>
        <div className="micro2m-entry-value">{item.entryTime || "—"}</div>
        <div className="micro2m-entry-sub">
          Close / expiry clock: {item.expTime || "Entry + 2 min"} · Set broker expiry to{" "}
          <strong>2 minutes</strong>
        </div>
      </div>

      <p className="micro2m-reason">{item.microReason}</p>
      <p className="micro2m-action">
        <strong>How to take:</strong> {item.pair} {item.direction} at entry time · expiry 2 minutes ·
        fixed small amount
      </p>
      <Micro2MJournalForm item={item} />
    </div>
  );
}

function WaitCard({ item }: { item: Micro2MSignal }) {
  const waiting = item.microPermission === "2M_WATCH";
  return (
    <div className={`micro2m-card muted ${waiting ? "perm-watch" : "perm-avoid"}`}>
      <div className={`micro2m-decision ${waiting ? "wait" : "skip"}`}>{decisionLabel(item)}</div>
      <div className="micro2m-top">
        <div>
          <div className="micro2m-pair">
            {item.pair} {item.direction}
          </div>
          <div className="micro2m-meta">
            Ready {item.microReadiness}% · needs 70%+ to take
          </div>
        </div>
        <div className="micro2m-ready dim">{item.microReadiness}%</div>
      </div>
      <p className="micro2m-reason">{item.microReason}</p>
      <p className="micro2m-action">
        <strong>Action:</strong> {waiting ? "Wait for next scan — do not enter yet." : "Skip this pair."}
      </p>
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

  const takeable = items.filter(isTakeable);
  const waiting = items.filter((i) => !isTakeable(i));
  const hasTake = takeable.length > 0;

  return (
    <div className={`micro2m-wrap${hasTake ? " has-take" : " no-take"}`}>
      <div className="micro2m-head">
        <h3>2-MINUTE TRADES</h3>
        <p className="micro2m-sub">
          Separate from 5-min / 15-min V9 LIVE. Only cards under <strong>TAKE THESE</strong> are real
          trades. Everything else is wait or skip.
        </p>
      </div>

      <div className={`micro2m-status ${hasTake ? "ok" : "stop"}`}>
        {hasTake ? (
          <>
            <strong>{takeable.length} trade(s) you can take</strong>
            <span>Enter at the time shown · broker expiry must be 2 minutes</span>
          </>
        ) : (
          <>
            <strong>Do not trade 2-minute now</strong>
            <span>
              No setup reached 70% readiness yet
              {waiting[0] ? ` (best is ${waiting[0].pair} at ${waiting[0].microReadiness}%)` : ""}.
              Wait for the next scan.
            </span>
          </>
        )}
      </div>

      {riskWarning ? <div className="micro2m-risk">{riskWarning}</div> : null}

      {!items.length ? (
        <p className="micro2m-empty">No 2-minute setups on this scan.</p>
      ) : (
        <>
          {hasTake ? (
            <div className="micro2m-block">
              <h4 className="micro2m-block-title take">TAKE THESE</h4>
              <div className="micro2m-grid">
                {takeable.map((item) => (
                  <TakeCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ) : null}

          {waiting.length > 0 ? (
            <div className="micro2m-block">
              <h4 className="micro2m-block-title skip">DO NOT TRADE</h4>
              <div className="micro2m-grid">
                {waiting.map((item) => (
                  <WaitCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      <p className="micro2m-footer">
        {livePresentation
          ? "Rule: take only from TAKE THESE. Ignore DO NOT TRADE cards. Fixed small amount. Stop after 2 losses."
          : "Rule: take only from TAKE THESE. Journal every 2-minute trade separately from V9 LIVE."}
      </p>
    </div>
  );
}
