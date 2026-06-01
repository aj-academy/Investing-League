import { formatJournalDate, formatJournalTime, isCountedInWr } from "@/lib/journal/journalDisplay";

export function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function journalToCsv(rows: Record<string, unknown>[]) {
  const cols = [
    "Date",
    "Signal Time",
    "Signal Type",
    "Counted In Eligible WR",
    "Signal Reason",
    "Pair",
    "Expiry",
    "Direction",
    "Grade",
    "Confidence",
    "Score",
    "Signal Entry Time",
    "Signal Entry Price",
    "Open Time",
    "Opening Quote",
    "Closing Quote",
    "Entry Drift Pips",
    "Entry Status",
    "Expiry Close Time",
    "Expiry Minutes",
    "Result",
    "Marked Time",
    "Loss Reason",
  ];

  const lines = [
    cols.join(","),
    ...rows.map((r) => {
      const counted = isCountedInWr(
        r.signal_type as string,
        r.grade as string,
        r.result as string
      )
        ? "YES"
        : "NO";
      return [
        r.created_at ? formatJournalDate(String(r.created_at)) : "",
        r.created_at ? formatJournalTime(String(r.created_at)) : "",
        r.signal_type,
        counted,
        r.signal_reason,
        r.pair,
        `${r.timeframe} expiry`,
        r.direction,
        r.grade,
        r.confidence,
        r.score,
        r.signal_entry_time,
        r.signal_entry_price,
        r.olymp_open_time,
        r.olymp_opening_quote,
        r.olymp_closing_quote,
        r.entry_drift,
        r.entry_status,
        r.expiry_time,
        r.expiry_minutes,
        r.result,
        r.marked_time,
        r.loss_reason,
      ]
        .map(csvEscape)
        .join(",");
    }),
  ];
  return lines.join("\n");
}
