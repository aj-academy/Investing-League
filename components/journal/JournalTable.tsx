"use client";

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
import { decimalsForPair } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  v9_layer?: string | null;
  v9_readiness?: number | null;
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

const AUTOSAVE_MS = 900;

const BLUR_SAVE_FIELDS: EditableField[] = ["openTime", "openingQuote", "closingQuote"];

const QUOTE_FIELD_ORDER: EditableField[] = ["openTime", "openingQuote", "closingQuote"];

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

function parseQuoteValue(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function quotePlaceholder(row: JournalRow, kind: "open" | "close"): string {
  if (kind === "open" && row.signal_entry_price != null) {
    return String(row.signal_entry_price);
  }
  return kind === "open" ? "Open quote" : "Close quote";
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

function draftToOptimisticRow(row: JournalRow, draft: RowDraft): JournalRow {
  const next = { ...row };
  if (draft.openTime !== undefined) {
    next.olymp_open_time = draft.openTime.trim() === "" ? null : draft.openTime;
  }
  if (draft.openingQuote !== undefined) {
    next.olymp_opening_quote = parseQuoteValue(draft.openingQuote);
  }
  if (draft.closingQuote !== undefined) {
    next.olymp_closing_quote = parseQuoteValue(draft.closingQuote);
  }
  if (draft.tradeId !== undefined) {
    next.olymp_trade_id = draft.tradeId.trim() === "" ? null : draft.tradeId;
  }
  if (draft.tradeAmount !== undefined) {
    next.trade_amount = parseQuoteValue(draft.tradeAmount);
  }
  if (draft.payoutPercent !== undefined) {
    next.payout_percent = parseQuoteValue(draft.payoutPercent);
  }
  if (draft.returnAmount !== undefined) {
    next.return_amount = parseQuoteValue(draft.returnAmount);
  }
  return next;
}

function statusLabel(status: RowStatus) {
  if (status === "saving") return "Saving…";
  if (status === "saved") return "Saved";
  if (status === "dirty") return "Editing…";
  if (status === "error") return "Error";
  return "";
}

function focusQuoteField(rowId: string, field: EditableField) {
  const el = document.querySelector<HTMLInputElement>(
    `[data-journal-row="${rowId}"][data-journal-field="${field}"]`,
  );
  el?.focus();
  el?.select();
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
  const savingRef = useRef<Record<string, boolean>>({});
  const pendingRef = useRef<Record<string, boolean>>({});
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

      if (savingRef.current[rowId]) {
        pendingRef.current[rowId] = true;
        return;
      }

      const row = rowsRef.current.find((r) => r.id === rowId);
      if (!row) return;

      const draft = draftsRef.current[rowId] ?? {};
      const body = buildPatchBody(row, draft);
      if (Object.keys(body).length === 0) {
        setRowStatus((s) => ({ ...s, [rowId]: "idle" }));
        return;
      }

      savingRef.current[rowId] = true;
      setRowStatus((s) => ({ ...s, [rowId]: "saving" }));
      onUpdated(draftToOptimisticRow(row, draft));

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
          }, 1500);
        }
      } catch {
        setRowStatus((s) => ({ ...s, [rowId]: "error" }));
        toast.error("Network error — journal row not saved");
      } finally {
        savingRef.current[rowId] = false;
        if (pendingRef.current[rowId]) {
          pendingRef.current[rowId] = false;
          void flushRef.current(rowId);
        }
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
      if (BLUR_SAVE_FIELDS.includes(field)) {
        setRowStatus((s) => ({ ...s, [rowId]: "dirty" }));
      } else {
        scheduleSave(rowId);
      }
    },
    [scheduleSave],
  );

  const fillFromSignal = useCallback((row: JournalRow) => {
    const updates: RowDraft = {};
    if (row.signal_entry_price != null) {
      updates.openingQuote = String(row.signal_entry_price);
    }
    if (row.signal_entry_time) {
      updates.openTime = row.signal_entry_time;
    }
    if (!updates.openingQuote && !updates.openTime) {
      toast.message("No signal price or time on this row.");
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [row.id]: { ...prev[row.id], ...updates },
    }));
    setRowStatus((s) => ({ ...s, [row.id]: "dirty" }));
    focusQuoteField(row.id, "closingQuote");
  }, []);

  const handleQuoteKeyDown = useCallback(
    (row: JournalRow, field: EditableField, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      void flushSave(row.id);
      const idx = QUOTE_FIELD_ORDER.indexOf(field);
      if (idx >= 0 && idx < QUOTE_FIELD_ORDER.length - 1) {
        focusQuoteField(row.id, QUOTE_FIELD_ORDER[idx + 1]);
      }
    },
    [flushSave],
  );

  const getDisplayValue = (row: JournalRow, field: EditableField) =>
    drafts[row.id]?.[field] ?? fieldValue(row, field);

  const openingForRow = (row: JournalRow) => {
    const draft = drafts[row.id]?.openingQuote;
    if (draft !== undefined) return parseQuoteValue(draft);
    return row.olymp_opening_quote;
  };

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
            openingForRow(r),
            r.entry_status,
            r.entry_drift,
          );
          const counted = isCountedInWr(r.signal_type, r.grade, r.result, r.v9_layer);
          const status = rowStatus[r.id] ?? "idle";
          const quoteStep = decimalsForPair(r.pair) === 3 ? "0.001" : "0.00001";

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
                <div className="journal-quote-cell">
                  <input
                    className="jinput jinput-wide"
                    data-journal-row={r.id}
                    data-journal-field="openTime"
                    value={getDisplayValue(r, "openTime")}
                    placeholder={r.signal_entry_time || "12:00:00"}
                    onChange={(e) => setField(r.id, "openTime", e.target.value)}
                    onBlur={() => void flushSave(r.id)}
                    onKeyDown={(e) => handleQuoteKeyDown(r, "openTime", e)}
                  />
                </div>
              </td>
              <td>
                <div className="journal-quote-cell">
                  <input
                    className="jinput jinput-price"
                    data-journal-row={r.id}
                    data-journal-field="openingQuote"
                    type="text"
                    inputMode="decimal"
                    step={quoteStep}
                    value={getDisplayValue(r, "openingQuote")}
                    placeholder={quotePlaceholder(r, "open")}
                    onChange={(e) => setField(r.id, "openingQuote", e.target.value)}
                    onBlur={() => void flushSave(r.id)}
                    onKeyDown={(e) => handleQuoteKeyDown(r, "openingQuote", e)}
                  />
                  <button
                    type="button"
                    className="journal-quote-fill"
                    title="Fill open time and price from signal"
                    onClick={() => fillFromSignal(r)}
                  >
                    Signal
                  </button>
                </div>
              </td>
              <td>
                <div className="journal-quote-cell">
                  <input
                    className="jinput jinput-price"
                    data-journal-row={r.id}
                    data-journal-field="closingQuote"
                    type="text"
                    inputMode="decimal"
                    step={quoteStep}
                    value={getDisplayValue(r, "closingQuote")}
                    placeholder={quotePlaceholder(r, "close")}
                    onChange={(e) => setField(r.id, "closingQuote", e.target.value)}
                    onBlur={() => void flushSave(r.id)}
                    onKeyDown={(e) => handleQuoteKeyDown(r, "closingQuote", e)}
                  />
                  <button
                    type="button"
                    className="journal-quote-save"
                    title="Save quotes now"
                    onClick={() => void flushSave(r.id)}
                  >
                    Save
                  </button>
                </div>
              </td>
              <td>
                <input
                  className="jinput jinput-price"
                  value={getDisplayValue(r, "tradeAmount")}
                  placeholder="2"
                  inputMode="decimal"
                  onChange={(e) => setField(r.id, "tradeAmount", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td>
                <input
                  className="jinput jinput-pct"
                  value={getDisplayValue(r, "payoutPercent")}
                  placeholder="90"
                  inputMode="decimal"
                  onChange={(e) => setField(r.id, "payoutPercent", e.target.value)}
                  onBlur={() => void flushSave(r.id)}
                />
              </td>
              <td>
                <input
                  className="jinput jinput-price"
                  value={getDisplayValue(r, "returnAmount")}
                  placeholder="Profit"
                  inputMode="decimal"
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
