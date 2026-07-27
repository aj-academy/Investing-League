"use client";

import type { Micro2MSignal } from "@/lib/signal-engine/micro2m/types";

function isTakeable(item: Micro2MSignal) {
  return (
    item.microPermission === "2M_MICRO_TRADE" || item.microPermission === "2M_STRONG_MICRO"
  );
}

function decisionLabel(item: Micro2MSignal): string {
  if (isTakeable(item)) {
    return item.direction === "PUT" ? "TAKE PUT" : "TAKE CALL";
  }
  if (item.microPermission === "2M_WATCH") return "WAIT — DO NOT TRADE";
  return "SKIP — DO NOT TRADE";
}

function TakeCard({ item, isPrimary }: { item: Micro2MSignal; isPrimary: boolean }) {
  const isPut = item.direction === "PUT";
  return (
    <div className={`micro2m-card takeable ${isPut ? "dir-put" : "dir-call"}${isPrimary ? " primary" : ""}`}>
      {isPrimary ? <div className="micro2m-best">BEST — TAKE THIS ONE FIRST</div> : null}
      <div className={`micro2m-dir-pill ${isPut ? "put" : "call"}`}>
        {isPut ? "▼ PUT" : "▲ CALL"}
      </div>
      <div className={`micro2m-decision ${isPut ? "take-put" : "take-call"}`}>
        {decisionLabel(item)}
      </div>
      <div className="micro2m-top">
        <div>
          <div className="micro2m-pair">
            {item.pair}{" "}
            <span className={isPut ? "dir-put-text" : "dir-call-text"}>{item.direction}</span>
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
          Expiry clock: {item.expTime || "Entry + 2 min"} · Broker expiry ={" "}
          <strong>2 minutes</strong>
        </div>
      </div>

      <p className="micro2m-reason">{item.microReason}</p>
      <p className="micro2m-action">
        <strong>How to take:</strong> {item.pair}{" "}
        <strong className={isPut ? "dir-put-text" : "dir-call-text"}>{item.direction}</strong> at
        entry time · expiry 2 minutes · fixed small amount
        {!isPrimary ? " · Prefer the BEST card if taking only one." : ""}
      </p>

      <div className="micro2m-auto-journal">
        Auto-saved to Journal (same as 5‑min signals). Open <strong>Journal</strong> to add platform
        open/close quotes and mark Win / Loss / Refund.
      </div>
    </div>
  );
}

function WaitCard({ item }: { item: Micro2MSignal }) {
  const waiting = item.microPermission === "2M_WATCH";
  const isPut = item.direction === "PUT";
  return (
    <div className={`micro2m-card muted ${waiting ? "perm-watch" : "perm-avoid"}`}>
      <div className={`micro2m-dir-pill soft ${isPut ? "put" : "call"}`}>
        {isPut ? "▼ PUT" : "▲ CALL"}
      </div>
      <div className={`micro2m-decision ${waiting ? "wait" : "skip"}`}>{decisionLabel(item)}</div>
      <div className="micro2m-top">
        <div>
          <div className="micro2m-pair">
            {item.pair}{" "}
            <span className={isPut ? "dir-put-text" : "dir-call-text"}>{item.direction}</span>
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
          Separate from 5-min / 15-min V9 LIVE. Takeable setups are <strong>auto-saved to Journal</strong>{" "}
          on scan (same flow as 5‑min). Red = PUT, green = CALL. Prefer BEST only.
        </p>
      </div>

      <div className={`micro2m-status ${hasTake ? "ok" : "stop"}`}>
        {hasTake ? (
          <>
            <strong>
              {takeable.length} takeable · auto-saved to Journal · prefer BEST only
            </strong>
            <span>
              Check ▲ CALL (green) vs ▼ PUT (red). Broker expiry = 2 minutes. Update quotes in Journal.
            </span>
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
                {takeable.map((item, idx) => (
                  <TakeCard key={item.id} item={item} isPrimary={idx === 0 || Boolean(item.isBest)} />
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
          ? "Journal: auto-saved on scan like 5‑min. Open Journal to enter platform quotes and result."
          : "Journal: takeable 2M setups auto-save on scan. Update results in Journal (same as V9)."}
      </p>
    </div>
  );
}
