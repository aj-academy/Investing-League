"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  signal_uid?: string | null;
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
  result_source?: string | null;
  entry_status: string | null;
  entry_drift: number | null;
  loss_reason: string | null;
  created_at: string;
  trade_amount?: number | null;
  payout_percent?: number | null;
  return_amount?: number | null;
  net_profit?: number | null;
  capital_before?: number | null;
  capital_after?: number | null;
  risk_status?: string | null;
  scan_mode?: string | null;
}

export type JournalRiskPayload = {
  lossLimitReached?: boolean;
  consecutiveLosses?: number;
  liveModeLocked?: boolean;
  cooldownUntil?: string | null;
};

type EditableField =
  | "tradeId"
  | "openTime"
  | "openingQuote"
  | "closingQuote"
  | "tradeAmount"
  | "payoutPercent"
  | "returnAmount";

type RowDraft = Partial<Record<EditableField, string>>;
type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 700;

const EDITABLE_FIELDS: EditableField[] = [
  "tradeId",
  "openTime",
  "openingQuote",
  "closingQuote",
  "tradeAmount",
  "payoutPercent",
  "returnAmount",
];

function resultClass(result: string) {
  if (result === "Win") return "jr-win";
  if (result === "Loss") return "jr-loss";
  if (result === "Refund") return "jr-refund";
  if (result === "Watch") return "jr-watch";
  return "jr-pending";
}

function fieldValue(row: JournalRow, field: EditableField): string {
  switch (field) {
    case "tradeId":
      return row.olymp_trade_id ?? "";
    case "openTime":
      return row.olymp_open_time ?? "";
    case "openingQuote":
      return row.olymp_opening_quote != null ? String(row.olymp_opening_quote) : "";
    case "closingQuote":
      return row.olymp_closing_quote != null ? String(row.olymp_closing_quote) : "";
    case "tradeAmount":
      return row.trade_amount != null ? String(row.trade_amount) : "";
    case "payoutPercent":
      return row.payout_percent != null ? String(row.payout_percent) : "";
    case "returnAmount":
      return row.return_amount != null ? String(row.return_amount) : "";
    default:
      return "";
  }
}

function buildPatchBody(row: JournalRow, draft: RowDraft): Record<string, string> {
  const body: Record<string, string> = {};
  for (const field of EDITABLE_FIELDS) {
    const next = draft[field] ?? fieldValue(row, field);
    const prev = fieldValue(row, field);
    if (next.trim() !== prev.trim()) {
      body[field] = next;
    }
  }
  return body;
}

function statusLabel(status: RowStatus) {
  if (status === "saving") return "Saving…";
  if (status === "saved") return "Saved";
  if (status === "dirty") return "Editing…";
  if (status === "error") return "Error";
  return "";
}

export function JournalTable({
  rows,
  onUpdated,
}: {
  rows: JournalRow[];
  onUpdated: (row: JournalRow, risk?: JournalRiskPayload) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const rowsRef = useRef(rows);
  const draftsRef = useRef(drafts);
  const flushRef = useRef<(rowId: string) => Promise<void>>(async () => {});

  rowsRef.current = rows;
  draftsRef.current = drafts;

  const clearDraft = useCallback((rowId: string) => {
    setDrafts((prev) => {
      if (!prev[rowId]) return prev;
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }, []);

  const flushSave = useCallback(
    async (rowId: string) => {
      const timer = timersRef.current[rowId];
      if (timer) {
        clearTimeout(timer);
        delete timersRef.current[rowId];
      }

      const row = rowsRef.current.find((r) => r.id === rowId);
      if (!row) return;

      const draft = draftsRef.current[rowId] ?? {};
      const body = buildPatchBody(row, draft);
      if (Object.keys(body).length === 0) {
        setRowStatus((s) => ({ ...s, [rowId]: "idle" }));
        return;
      }

      setRowStatus((s) => ({ ...s, [rowId]: "saving" }));

      try {
        const res = await fetch("/api/journal/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journalId: row.id,
            signalUid: row.signal_uid ?? null,
            ...body,
          }),
        });
        const json = (await res.json()) as {
          row?: JournalRow;
          error?: string;
          risk?: JournalRiskPayload;
        };

        if (!res.ok) {
          setRowStatus((s) => ({ ...s, [rowId]: "error" }));
          toast.error(json.error || "Could not save journal row");
          return;
        }

        if (json.row) {
          onUpdated(json.row, json.risk);
          clearDraft(rowId);
          setRowStatus((s) => ({ ...s, [rowId]: "saved" }));
          window.setTimeout(() => {
            setRowStatus((s) => ({ ...s, [rowId]: "idle" }));
          }, 2000);
        }
      } catch {
        setRowStatus((s) => ({ ...s, [rowId]: "error" }));
        toast.error("Network error — journal row not saved");
      }
    },
    [clearDraft, onUpdated],
  );

  flushRef.current = flushSave;

  const scheduleSave = useCallback((rowId: string) => {
    setRowStatus((s) => ({ ...s, [rowId]: "dirty" }));
    if (timersRef.current[rowId]) clearTimeout(timersRef.current[rowId]);
    timersRef.current[rowId] = setTimeout(() => {
      void flushRef.current(rowId);
    }, AUTOSAVE_MS);
  }, []);

  const setField = useCallback(
    (rowId: string, field: EditableField, value: string) => {
      setDrafts((prev) => ({
        ...prev,
        [rowId]: { ...prev[rowId], [field]: value },
      }));
      scheduleSave(rowId);
    },
    [scheduleSave],
  );

  const getDisplayValue = (row: JournalRow, field: EditableField) =>
    drafts[row.id]?.[field] ?? fieldValue(row, field);

  const flushAll = useCallback(async () => {
    const ids = new Set<string>();
    for (const row of rowsRef.current) {
      const body = buildPatchBody(row, draftsRef.current[row.id] ?? {});
      if (Object.keys(body).length > 0) ids.add(row.id);
    }
    for (const id of ids) {
      await flushRef.current(id);
    }
  }, []);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flushAll();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flushAll();
      for (const t of Object.values(timersRef.current)) clearTimeout(t);
    };
  }, [flushAll]);

  const markResult = async (row: JournalRow, result: string) => {
    if (row.result === result) return;
    await flushSave(row.id);
    setRowStatus((s) => ({ ...s, [row.id]: "saving" }));
    try {
      const res = await fetch("/api/journal/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journalId: row.id,
          signalUid: row.signal_uid ?? null,
          result,
        }),
      });
      const json = (await res.json()) as {
        row?: JournalRow;
        error?: string;
        risk?: JournalRiskPayload;
      };
      if (!res.ok) {
        setRowStatus((s) => ({ ...s, [row.id]: "error" }));
        toast.error(json.error || "Could not update result");
        return;
      }
      if (json.row) {
        onUpdated(json.row, json.risk);
        setRowStatus((s) => ({ ...s, [row.id]: "saved" }));
      }
    } catch {
      setRowStatus((s) => ({ ...s, [row.id]: "error" }));
      toast.error("Network error — result not saved");
    }
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
          <th>Save</th>
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
          <th>Trade Amt</th>
          <th>Payout %</th>
          <th>Profit</th>
          <th>Net P/L</th>
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
            r.entry_drift,
          );
          const counted = isCountedInWr(r.signal_type, r.grade, r.result);
          const status = rowStatus[r.id] ?? "idle";
          const isSaving = status === "saving";

          return (
            <tr key={r.id}>
              <td className={`jr-save-status jr-save-${status}`}>{statusLabel(status)}</td>
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
                  className="jinput jinput-wide"
                  value={getDisplayValue(r, "tradeId")}
                  placeholder="Trade ID"
                  disabled={isSaving}
                  onChange={(e) => setField(r.id, "tradeId", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
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
                  className="jinput jinput-wide"
                  value={getDisplayValue(r, "openTime")}
                  placeholder="12:00:00"
                  disabled={isSaving}
                  onChange={(e) => setField(r.id, "openTime", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td>
                <input
                  className="jinput jinput-price"
                  value={getDisplayValue(r, "openingQuote")}
                  placeholder="Open quote"
                  disabled={isSaving}
                  onChange={(e) => setField(r.id, "openingQuote", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td>
                <input
                  className="jinput jinput-price"
                  value={getDisplayValue(r, "closingQuote")}
                  placeholder="Close quote"
                  disabled={isSaving}
                  onChange={(e) => setField(r.id, "closingQuote", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td>
                <input
                  className="jinput jinput-price"
                  value={getDisplayValue(r, "tradeAmount")}
                  placeholder="2"
                  disabled={isSaving}
                  onChange={(e) => setField(r.id, "tradeAmount", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td>
                <input
                  className="jinput jinput-pct"
                  value={getDisplayValue(r, "payoutPercent")}
                  placeholder="90"
                  disabled={isSaving}
                  onChange={(e) => setField(r.id, "payoutPercent", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td>
                <input
                  className="jinput jinput-price"
                  value={getDisplayValue(r, "returnAmount")}
                  placeholder="Profit"
                  disabled={isSaving}
                  onChange={(e) => setField(r.id, "returnAmount", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td className={resultClass(r.result)}>
                {r.net_profit != null ? Number(r.net_profit).toFixed(2) : "—"}
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
                        onChange={() => void markResult(r, res)}
                        disabled={isSaving}
                      />
                      {res}
                    </label>
                  ))}
                </div>
              </td>
              <td style={{ maxWidth: 200, whiteSpace: "normal" }}>{lossReasonText(r)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
