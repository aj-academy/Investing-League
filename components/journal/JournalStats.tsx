import { computeJournalStats, computeMicro2MJournalStats } from "@/lib/journal/journalDisplay";
import type { JournalRow } from "./JournalTable";

export function JournalStats({ rows }: { rows: JournalRow[] }) {
  const s = computeJournalStats(rows);
  const m = computeMicro2MJournalStats(rows);

  return (
    <>
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
      {m.total > 0 ? (
        <div className="journal-stats" style={{ marginTop: 10 }}>
          <div className="jstat">
            <div className="jstat-v" style={{ color: "#4fd1c5" }}>
              {m.total}
            </div>
            <div className="jstat-l">2M Micro Trades</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ color: "var(--bull)" }}>
              {m.wins}
            </div>
            <div className="jstat-l">2M Wins</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ color: "var(--bear)" }}>
              {m.losses}
            </div>
            <div className="jstat-l">2M Losses</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{m.refunds}</div>
            <div className="jstat-l">2M Refunds</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ color: "#4fd1c5" }}>
              {m.winRate}
            </div>
            <div className="jstat-l">2M Win Rate</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ fontSize: 12 }}>
              {m.bestPair}
            </div>
            <div className="jstat-l">Best 2M Pair</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ fontSize: 12 }}>
              {m.worstPair}
            </div>
            <div className="jstat-l">Worst 2M Pair</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ fontSize: 12 }}>
              {m.bestDirection}
            </div>
            <div className="jstat-l">Best 2M Direction</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ fontSize: 12 }}>
              {m.wr70_74}
            </div>
            <div className="jstat-l">2M WR 70–74</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ fontSize: 12 }}>
              {m.wr75_79}
            </div>
            <div className="jstat-l">2M WR 75–79</div>
          </div>
          <div className="jstat">
            <div className="jstat-v" style={{ fontSize: 12 }}>
              {m.wr80plus}
            </div>
            <div className="jstat-l">2M WR 80+</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
