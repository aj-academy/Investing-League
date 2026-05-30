export function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function journalToCsv(rows: Record<string, unknown>[]) {
  const cols = [
    "Date",
    "Signal Time",
    "Pair",
    "Timeframe",
    "Direction",
    "Grade",
    "Confidence",
    "Score",
    "Signal Type",
    "Signal Entry Time",
    "Signal Entry Price",
    "Olymp Open Time",
    "Olymp Opening Quote",
    "Olymp Closing Quote",
    "Olymp Trade ID",
    "Expiry Time",
    "Expiry Minutes",
    "Result",
    "Entry Status",
    "Entry Drift",
    "Loss Reason",
    "Marked Time",
  ];

  const lines = [
    cols.join(","),
    ...rows.map((r) =>
      [
        r.created_at,
        r.signal_entry_time,
        r.pair,
        r.timeframe,
        r.direction,
        r.grade,
        r.confidence,
        r.score,
        r.signal_type,
        r.signal_entry_time,
        r.signal_entry_price,
        r.olymp_open_time,
        r.olymp_opening_quote,
        r.olymp_closing_quote,
        r.olymp_trade_id,
        r.expiry_time,
        r.expiry_minutes,
        r.result,
        r.entry_status,
        r.entry_drift,
        r.loss_reason,
        r.marked_time,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}
