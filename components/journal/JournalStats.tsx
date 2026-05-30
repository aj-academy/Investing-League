import { calculateRealWinRate } from "@/lib/analytics/winRate";
import type { JournalRow } from "./JournalTable";

export function JournalStats({ rows }: { rows: JournalRow[] }) {
  const total = rows.length;
  const done = rows.filter((r) => ["Win", "Loss", "Refund"].includes(String(r.result))).length;
  const wins = rows.filter((r) => r.result === "Win").length;
  const losses = rows.filter((r) => r.result === "Loss").length;
  const real = calculateRealWinRate(
    rows.map((r) => ({
      signal_type: r.signal_type as string,
      grade: r.grade as string,
      result: r.result as string,
    }))
  );

  return (
    <div className="journal-stats">
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--blue2)" }}>
          {total}
        </div>
        <div className="jstat-l">Total Signals</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--txt2)" }}>
          {done}
        </div>
        <div className="jstat-l">Completed</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--bull)" }}>
          {wins}
        </div>
        <div className="jstat-l">Wins</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--bear)" }}>
          {losses}
        </div>
        <div className="jstat-l">Losses</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--bull2)" }}>
          {real.rate}%
        </div>
        <div className="jstat-l">Final Trade WR</div>
      </div>
    </div>
  );
}
