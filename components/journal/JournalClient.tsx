"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { LossLimitModal } from "@/components/risk/LossLimitModal";
import { JournalStats } from "./JournalStats";
import { JournalTable, type JournalRow, type JournalRiskPayload } from "./JournalTable";

export function JournalClient({ initialRows }: { initialRows: JournalRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [refreshing, startRefresh] = useTransition();
  const [showLossModal, setShowLossModal] = useState(false);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

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
        Autosave — pauses save after you type; switches page saves open edits. Check the Save
        column per row.
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
      <JournalStats rows={rows} />
      <div className="journal-table-wrap">
        <JournalTable rows={rows} onUpdated={onRowUpdated} />
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
