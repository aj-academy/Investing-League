import { computeJournalStats } from "@/lib/journal/journalDisplay";
import type { JournalRow } from "./JournalTable";

export function JournalStats({ rows }: { rows: JournalRow[] }) {
  const s = computeJournalStats(rows);

  return (
    <div className="journal-stats">
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--blue2)" }}>
          {s.total}
        </div>
        <div className="jstat-l">Total Signals</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--cyan)" }}>
          {s.tradeEligible}
        </div>
        <div className="jstat-l">Trade Eligible</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--txt2)" }}>
          {s.verifiedTrades}
        </div>
        <div className="jstat-l">Verified Trades</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--bull)" }}>
          {s.eligibleWins}
        </div>
        <div className="jstat-l">Eligible Wins</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--bear)" }}>
          {s.eligibleLosses}
        </div>
        <div className="jstat-l">Eligible Losses</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--gold)" }}>
          {s.eligibleWr}
        </div>
        <div className="jstat-l">Eligible WR</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--bull2)" }}>
          {s.strongWr}
        </div>
        <div className="jstat-l">Strong WR</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ color: "var(--gold2)" }}>
          {s.observation}
        </div>
        <div className="jstat-l">Observation</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ fontSize: 12, color: "var(--txt2)" }}>
          {s.bestPair}
        </div>
        <div className="jstat-l">Best Pair</div>
      </div>
      <div className="jstat">
        <div className="jstat-v" style={{ fontSize: 12, color: "var(--txt2)" }}>
          {s.bestExpiry}
        </div>
        <div className="jstat-l">Best Expiry</div>
      </div>
    </div>
  );
}
