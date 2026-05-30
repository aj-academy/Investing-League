"use client";

import { useState } from "react";
import { toast } from "sonner";

export interface JournalRow {
  id: string;
  pair: string;
  timeframe: string;
  direction: string;
  grade: string | null;
  confidence: number | null;
  signal_type: string | null;
  signal_entry_time: string | null;
  signal_entry_price: number | null;
  olymp_open_time: string | null;
  olymp_opening_quote: number | null;
  olymp_closing_quote: number | null;
  olymp_trade_id: string | null;
  expiry_time: string | null;
  result: string;
  entry_status: string | null;
  loss_reason: string | null;
  created_at: string;
}

export function JournalTable({
  rows,
  onUpdated,
}: {
  rows: JournalRow[];
  onUpdated: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  const update = async (id: string, field: string, value: string) => {
    setSaving(id);
    const body: Record<string, string> = { journalId: id };
    if (field === "olymp_opening_quote") body.olympOpeningQuote = value;
    if (field === "olymp_closing_quote") body.olympClosingQuote = value;
    if (field === "olymp_trade_id") body.olympTradeId = value;
    if (field === "loss_reason") body.lossReason = value;

    const res = await fetch("/api/journal/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(null);
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error || "Update failed");
      return;
    }
    toast.success("Journal updated");
    onUpdated();
  };

  if (!rows.length) {
    return (
      <div className="journal-empty">
        No signals saved yet. Run a scan from the dashboard. Only STRONG FINAL / FINAL TRADE
        counts in real win rate. Fill Olymp Opening + Closing Quote to auto-calculate result.
      </div>
    );
  }

  return (
    <table className="journal-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Pair</th>
          <th>TF</th>
          <th>Dir</th>
          <th>Grade</th>
          <th>Type</th>
          <th>Signal Entry</th>
          <th>Olymp Open</th>
          <th>Olymp Close</th>
          <th>Trade ID</th>
          <th>Entry Status</th>
          <th>Result</th>
          <th>Loss Reason</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{new Date(r.created_at).toLocaleDateString()}</td>
            <td>{r.pair}</td>
            <td>{r.timeframe}</td>
            <td className={r.direction === "CALL" ? "jr-call" : "jr-put"}>{r.direction}</td>
            <td>{r.grade}</td>
            <td>{r.signal_type}</td>
            <td>
              {r.signal_entry_time} @ {r.signal_entry_price}
            </td>
            <td>
              <input
                className="jinput price"
                defaultValue={r.olymp_opening_quote ?? ""}
                placeholder="Open quote"
                onBlur={(e) => update(r.id, "olymp_opening_quote", e.target.value)}
                disabled={saving === r.id}
              />
            </td>
            <td>
              <input
                className="jinput price"
                defaultValue={r.olymp_closing_quote ?? ""}
                placeholder="Close quote"
                onBlur={(e) => update(r.id, "olymp_closing_quote", e.target.value)}
                disabled={saving === r.id}
              />
            </td>
            <td>
              <input
                className="jinput"
                defaultValue={r.olymp_trade_id ?? ""}
                placeholder="Trade ID"
                onBlur={(e) => update(r.id, "olymp_trade_id", e.target.value)}
                disabled={saving === r.id}
              />
            </td>
            <td>{r.entry_status || "Pending"}</td>
            <td
              className={
                r.result === "Win"
                  ? "jr-win"
                  : r.result === "Loss"
                    ? "jr-loss"
                    : r.result === "Refund"
                      ? "jr-refund"
                      : "jr-pending"
              }
            >
              {r.result}
            </td>
            <td>
              <input
                className="jinput"
                defaultValue={r.loss_reason ?? ""}
                placeholder="Loss reason"
                onBlur={(e) => update(r.id, "loss_reason", e.target.value)}
                disabled={saving === r.id}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
