"use client";

import { useRouter } from "next/navigation";
import { JournalStats } from "./JournalStats";
import { JournalTable, type JournalRow } from "./JournalTable";

export function JournalClient({ initialRows }: { initialRows: JournalRow[] }) {
  const router = useRouter();
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
          onClick={() => {
            router.refresh();
          }}
        >
          ↻ Refresh journal
        </button>
      </div>
      <JournalStats rows={initialRows} />
      <div className="journal-table-wrap">
        <JournalTable rows={initialRows} onUpdated={() => router.refresh()} />
      </div>
    </>
  );
}
