"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { JournalStats } from "./JournalStats";
import { JournalTable, type JournalRow } from "./JournalTable";

export function JournalClient({ initialRows }: { initialRows: JournalRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [refreshing, startRefresh] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const onRowUpdated = useCallback((updated: JournalRow) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  }, []);

  return (
    <>
      <div
        style={{
          fontSize: 10,
          color: "var(--bull)",
          marginBottom: 10,
          fontFamily: "var(--mono)",
        }}
      >
        ● JOURNAL AUTOSAVE ON
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
    </>
  );
}
