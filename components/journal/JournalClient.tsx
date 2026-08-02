"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { LossLimitModal } from "@/components/risk/LossLimitModal";
import {
  DEFAULT_JOURNAL_FILTERS,
  filterJournalRows,
  pairsForJournalFilter,
  type JournalFilterState,
} from "@/lib/journal/journalFilters";
import { JournalFilters } from "./JournalFilters";
import { JournalStats } from "./JournalStats";
import { JournalTable, type JournalRow, type JournalRiskPayload } from "./JournalTable";

export function JournalClient({ initialRows }: { initialRows: JournalRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [filters, setFilters] = useState<JournalFilterState>(DEFAULT_JOURNAL_FILTERS);
  const [refreshing, startRefresh] = useTransition();
  const [showLossModal, setShowLossModal] = useState(false);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const pairs = useMemo(() => pairsForJournalFilter(rows), [rows]);
  const filteredRows = useMemo(() => filterJournalRows(rows, filters), [rows, filters]);

  const onRowUpdated = useCallback((updated: JournalRow, risk?: JournalRiskPayload) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    if (risk?.lossLimitReached) setShowLossModal(true);
  }, []);

  const pauseTrading = async () => {
    await fetch("/api/risk/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes: 30 }),
    });
    setShowLossModal(false);
  };

  return (
    <>
      <div className="journal-autosave-hint">
        <span className="journal-autosave-dot" />
        Profit = broker profit on a win (e.g. 500 stake at 80% → enter 400, not 900). Quotes save on
        blur or Enter — use Signal to fill open price/time, then tab to closing quote.
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          type="button"
          className="jbtn"
          disabled={refreshing}
          onClick={() => startRefresh(() => router.refresh())}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh journal"}
        </button>
      </div>
      <JournalFilters
        filters={filters}
        onChange={setFilters}
        pairs={pairs}
        totalCount={rows.length}
        filteredCount={filteredRows.length}
      />
      <JournalStats rows={filteredRows} />
      <div className="journal-table-wrap">
        {filteredRows.length === 0 && rows.length > 0 ? (
          <div className="journal-empty">
            No journal rows match these filters. Try widening the date range, set timeframe to
            &quot;All timeframes&quot;, or permission to &quot;All levels&quot;.
          </div>
        ) : (
          <JournalTable rows={filteredRows} onUpdated={onRowUpdated} />
        )}
      </div>
      {showLossModal && (
        <LossLimitModal
          onPracticeOnly={() => setShowLossModal(false)}
          onPause={() => void pauseTrading()}
          onViewJournal={() => setShowLossModal(false)}
        />
      )}
    </>
  );
}
