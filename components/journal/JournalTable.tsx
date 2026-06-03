"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  driftDisplay,
  formatJournalDate,
  formatJournalTime,
  isCountedInWr,
  lossReasonText,
  permissionClass,
  rowPermission,
  signalTypeClass,
} from "@/lib/journal/journalDisplay";

export interface JournalRow {
  id: string;
  pair: string;
  timeframe: string;
  direction: string;
  grade: string | null;
  confidence: number | null;
  score: number | null;
  signal_type: string | null;
  trade_eligible?: boolean | null;
  signal_reason: string | null;
  signal_entry_time: string | null;
  signal_entry_price: number | null;
  olymp_open_time: string | null;
  olymp_opening_quote: number | null;
  olymp_closing_quote: number | null;
  olymp_trade_id: string | null;
  expiry_time: string | null;
  expiry_minutes: number | null;
  result: string;
  entry_status: string | null;
  entry_drift: number | null;
  loss_reason: string | null;
  created_at: string;
}

function resultClass(result: string) {
  if (result === "Win") return "jr-win";
  if (result === "Loss") return "jr-loss";
  if (result === "Refund") return "jr-refund";
  if (result === "Watch") return "jr-watch";
  return "jr-pending";
}

export function JournalTable({
  rows,
  onUpdated,
}: {
  rows: JournalRow[];
  onUpdated: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  const patch = useCallback(
    async (id: string, body: Record<string, string | null>) => {
      setSaving(id);
      const res = await fetch("/api/journal/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journalId: id, ...body }),
      });
      setSaving(null);
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Update failed");
        return false;
      }
      onUpdated();
      return true;
    },
    [onUpdated]
  );

  const onBlurField = async (id: string, field: string, value: string) => {
    const ok = await patch(id, { [field]: value });
    if (ok) toast.success("Saved");
  };

  const markResult = async (id: string, result: string) => {
    const ok = await patch(id, { result });
    if (ok) toast.success(`Marked ${result}`);
  };

  if (!rows.length) {
    return (
      <div className="journal-empty">
        No signals saved yet. Run a scan from the dashboard. Only STRONG FINAL / FINAL TRADE
        counts in eligible win rate. Fill Opening + Closing Quote to auto-calculate result.
      </div>
    );
  }

  return (
    <table className="journal-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Signal Time</th>
          <th>Permission</th>
          <th>Signal Type</th>
          <th>Counted?</th>
          <th>Trade ID</th>
          <th>Pair</th>
          <th>Expiry</th>
          <th>Direction</th>
          <th>Grade</th>
          <th>Conf.</th>
          <th>Signal Entry Time</th>
          <th>Signal Entry Price</th>
          <th>Open Time</th>
          <th>Opening Quote</th>
          <th>Closing Quote</th>
          <th>Drift</th>
          <th>Expiry Close Time</th>
          <th>Result</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const type = r.signal_type || "WATCH ONLY";
          const perm = rowPermission(type, r.trade_eligible);
          const drift = driftDisplay(
            r.pair,
            r.signal_entry_price,
            r.olymp_opening_quote,
            r.entry_status,
            r.entry_drift
          );
          const counted = isCountedInWr(r.signal_type, r.grade, r.result);

          return (
            <tr key={r.id}>
              <td>{formatJournalDate(r.created_at)}</td>
              <td>{formatJournalTime(r.created_at)}</td>
              <td>
                <span className={`permission-pill ${permissionClass(perm)}`}>{perm}</span>
              </td>
              <td>
                <span className={`signal-type-mini ${signalTypeClass(type)}`}>{type}</span>
              </td>
              <td>
                {counted ? (
                  <span style={{ color: "var(--bull)", fontWeight: 800 }}>YES</span>
                ) : (
                  <span style={{ color: "var(--m3)" }}>NO</span>
                )}
              </td>
              <td>
                <input
                  className="jinput"
                  style={{ width: 100 }}
                  defaultValue={r.olymp_trade_id ?? ""}
                  placeholder="ID"
                  disabled={saving === r.id}
                  onBlur={(e) => onBlurField(r.id, "tradeId", e.target.value)}
                />
              </td>
              <td>{r.pair}</td>
              <td>{r.timeframe} expiry</td>
              <td className={r.direction === "CALL" ? "jr-call" : "jr-put"}>{r.direction}</td>
              <td>{r.grade ?? "—"}</td>
              <td>{r.confidence != null ? `${Math.round(Number(r.confidence))}%` : "—"}</td>
              <td>{r.signal_entry_time || "—"}</td>
              <td>{r.signal_entry_price ?? "—"}</td>
              <td>
                <input
                  className="jinput"
                  defaultValue={r.olymp_open_time ?? ""}
                  placeholder="12:00:00"
                  disabled={saving === r.id}
                  onBlur={(e) => onBlurField(r.id, "openTime", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="jinput price"
                  defaultValue={r.olymp_opening_quote ?? ""}
                  placeholder="1.33371"
                  disabled={saving === r.id}
                  onBlur={(e) => onBlurField(r.id, "openingQuote", e.target.value)}
                />
              </td>
              <td>
                <input
                  className="jinput price"
                  defaultValue={r.olymp_closing_quote ?? ""}
                  placeholder="1.33471"
                  disabled={saving === r.id}
                  onBlur={(e) => onBlurField(r.id, "closingQuote", e.target.value)}
                />
              </td>
              <td>
                <span className={`entry-status ${drift.cls}`}>
                  {drift.status}
                  {drift.pips ? (
                    <>
                      <br />
                      <small>{drift.pips}</small>
                    </>
                  ) : null}
                </span>
              </td>
              <td>{r.expiry_time || "—"}</td>
              <td className={resultClass(r.result)}>
                <div className="result-checks">
                  {(["Win", "Loss", "Refund", "Pending"] as const).map((res) => (
                    <label
                      key={res}
                      className={`result-check ${res.toLowerCase()} ${r.result === res ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`result-${r.id}`}
                        checked={r.result === res}
                        onChange={() => markResult(r.id, res)}
                        disabled={saving === r.id}
                      />
                      {res}
                    </label>
                  ))}
                </div>
              </td>
              <td style={{ maxWidth: 200, whiteSpace: "normal" }}>
                {lossReasonText(r)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
