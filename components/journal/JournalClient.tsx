"use client";

import { useRouter } from "next/navigation";
import { JournalStats } from "./JournalStats";
import { JournalTable, type JournalRow } from "./JournalTable";

export function JournalClient({ initialRows }: { initialRows: JournalRow[] }) {
  const router = useRouter();
  return (
    <>
      <JournalStats rows={initialRows} />
      <div className="journal-table-wrap">
        <JournalTable rows={initialRows} onUpdated={() => router.refresh()} />
      </div>
    </>
  );
}
