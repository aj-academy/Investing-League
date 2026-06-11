type ReportCsvInput = {
  profile: {
    email?: string | null;
    full_name?: string | null;
    plan?: string | null;
    role?: string | null;
    is_active?: boolean;
    created_at?: string;
  };
  allowedAssets?: string[];
  usage?: {
    scansToday?: number;
    totalScans?: number;
    providerCalls?: number;
    cacheHits?: number;
    scansInRange?: number;
    providerCallsInRange?: number;
    cacheHitsInRange?: number;
  };
  totals?: Record<string, unknown>;
  recentScans?: Array<Record<string, unknown>>;
  recentJournal?: Array<Record<string, unknown>>;
  filter?: { from?: string; to?: string; result?: string };
};

function esc(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(values: unknown[]): string {
  return values.map(esc).join(",");
}

export function userReportToCsv(data: ReportCsvInput): string {
  const lines: string[] = [];
  const p = data.profile;

  lines.push("User Report");
  lines.push(row(["Email", p.email, "Name", p.full_name]));
  lines.push(row(["Plan", p.plan, "Role", p.role]));
  lines.push(row(["Active", p.is_active ? "Yes" : "No", "Joined", p.created_at]));
  if (data.filter?.from || data.filter?.to) {
    lines.push(row(["Filter From", data.filter.from, "Filter To", data.filter.to]));
  }
  if (data.filter?.result) {
    lines.push(row(["Journal Result Filter", data.filter.result]));
  }
  lines.push(row(["Allowed Assets", (data.allowedAssets || []).join("; ")]));
  lines.push("");

  lines.push("Usage");
  lines.push(
    row([
      "Scans Today",
      data.usage?.scansToday,
      "Total Scans",
      data.usage?.totalScans,
      "Provider Calls",
      data.usage?.providerCalls,
      "Cache Hits",
      data.usage?.cacheHits,
    ])
  );
  if (data.usage?.scansInRange != null) {
    lines.push(
      row([
        "Scans In Range",
        data.usage.scansInRange,
        "Provider In Range",
        data.usage.providerCallsInRange,
        "Cache In Range",
        data.usage.cacheHitsInRange,
      ])
    );
  }
  lines.push("");

  lines.push("Totals");
  for (const [key, value] of Object.entries(data.totals || {})) {
    lines.push(row([key, value]));
  }
  lines.push("");

  lines.push("Recent Scans");
  lines.push(row(["Created", "Mode", "Pairs", "Timeframes", "Signals", "Provider", "Cache"]));
  for (const s of data.recentScans || []) {
    lines.push(
      row([
        s.created_at,
        s.mode,
        Array.isArray(s.pairs) ? (s.pairs as string[]).join("; ") : s.pairs,
        Array.isArray(s.timeframes) ? (s.timeframes as string[]).join("; ") : s.timeframes,
        s.total_signals,
        s.provider_calls,
        s.cache_hits,
      ])
    );
  }
  lines.push("");

  lines.push("Journal");
  lines.push(row(["Created", "Pair", "Result", "Signal Type", "Grade"]));
  for (const j of data.recentJournal || []) {
    lines.push(row([j.created_at, j.pair, j.result, j.signal_type, j.grade]));
  }

  return lines.join("\n");
}
