"use client";

import { formatAppDateTime } from "@/lib/datetime";
import type {
  AdminJournalRow,
  AdminJournalSummary,
  AdminUserJournalSummary,
} from "@/lib/admin/adminJournal";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const SIGNAL_TYPES = [
  "",
  "Trade Allowed",
  "Watch Only",
  "Late Entry",
  "Repeated",
  "Trend Exhausted",
  "Do Not Trade",
];

export function AdminJournalTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AdminJournalRow[]>([]);
  const [summary, setSummary] = useState<AdminJournalSummary | null>(null);
  const [userSummaries, setUserSummaries] = useState<AdminUserJournalSummary[]>([]);
  const [filters, setFilters] = useState({
    userName: "",
    email: "",
    from: "",
    to: "",
    pair: "",
    result: "",
    signalType: "",
    mode: "",
    timeframe: "",
    plan: "",
    verifiedOnly: false,
    pendingOnly: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.userName) params.set("userName", filters.userName);
    if (filters.email) params.set("email", filters.email);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.pair) params.set("pair", filters.pair);
    if (filters.result) params.set("result", filters.result);
    if (filters.signalType) params.set("signalType", filters.signalType);
    if (filters.mode) params.set("mode", filters.mode);
    if (filters.timeframe) params.set("timeframe", filters.timeframe);
    if (filters.plan) params.set("plan", filters.plan);
    if (filters.verifiedOnly) params.set("verifiedOnly", "1");
    if (filters.pendingOnly) params.set("pendingOnly", "1");

    try {
      const res = await fetch(`/api/admin/journal?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not load journal");
        return;
      }
      setRows(json.rows || []);
      setSummary(json.summary || null);
      setUserSummaries(json.userSummaries || []);
    } catch {
      toast.error("Could not load journal");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (typeof v === "string" && v) params.set(k, v);
      if (typeof v === "boolean" && v) params.set(k, "1");
    });
    params.set("format", "csv");
    window.open(`/api/admin/journal?${params.toString()}`, "_blank");
  };

  const clearUserLock = async (userId: string) => {
    const res = await fetch("/api/risk/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "admin_clear_lock", userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not clear lock");
      return;
    }
    toast.success("Live mode lock cleared");
    void load();
  };

  return (
    <div className="ctrl admin-panel" style={{ marginTop: 16 }}>
      <div className="ctrl-title">Admin Journal</div>
      <p className="admin-page-sub" style={{ marginBottom: 12 }}>
        Complete journal across all users with capital and discipline filters.
      </p>

      <div className="ctrl-row">
        <div className="f">
          <label>User name</label>
          <input
            value={filters.userName}
            onChange={(e) => setFilters((s) => ({ ...s, userName: e.target.value }))}
          />
        </div>
        <div className="f">
          <label>Email</label>
          <input
            value={filters.email}
            onChange={(e) => setFilters((s) => ({ ...s, email: e.target.value }))}
          />
        </div>
        <div className="f">
          <label>From</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))}
          />
        </div>
        <div className="f">
          <label>To</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))}
          />
        </div>
        <div className="f">
          <label>Pair</label>
          <input
            value={filters.pair}
            onChange={(e) => setFilters((s) => ({ ...s, pair: e.target.value }))}
            placeholder="EUR/USD"
          />
        </div>
        <div className="f">
          <label>Result</label>
          <select
            value={filters.result}
            onChange={(e) => setFilters((s) => ({ ...s, result: e.target.value }))}
          >
            <option value="">All</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
            <option value="Refund">Refund</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div className="f">
          <label>Signal type</label>
          <select
            value={filters.signalType}
            onChange={(e) => setFilters((s) => ({ ...s, signalType: e.target.value }))}
          >
            {SIGNAL_TYPES.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All"}
              </option>
            ))}
          </select>
        </div>
        <div className="f">
          <label>Mode</label>
          <select
            value={filters.mode}
            onChange={(e) => setFilters((s) => ({ ...s, mode: e.target.value }))}
          >
            <option value="">All</option>
            <option value="practice">Practice</option>
            <option value="live">Live</option>
          </select>
        </div>
        <div className="f">
          <label>Timeframe</label>
          <select
            value={filters.timeframe}
            onChange={(e) => setFilters((s) => ({ ...s, timeframe: e.target.value }))}
          >
            <option value="">All</option>
            <option value="5min">5min</option>
            <option value="15min">15min</option>
          </select>
        </div>
        <div className="f">
          <label>Plan</label>
          <select
            value={filters.plan}
            onChange={(e) => setFilters((s) => ({ ...s, plan: e.target.value }))}
          >
            <option value="">All</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div className="f" style={{ alignSelf: "end" }}>
          <label>
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => setFilters((s) => ({ ...s, verifiedOnly: e.target.checked }))}
            />
            Verified only
          </label>
        </div>
        <div className="f" style={{ alignSelf: "end" }}>
          <label>
            <input
              type="checkbox"
              checked={filters.pendingOnly}
              onChange={(e) => setFilters((s) => ({ ...s, pendingOnly: e.target.checked }))}
            />
            Pending only
          </label>
        </div>
        <div className="f" style={{ alignSelf: "end" }}>
          <button type="button" className="jbtn" onClick={() => void load()}>
            Apply filters
          </button>
        </div>
        <div className="f" style={{ alignSelf: "end" }}>
          <button type="button" className="jbtn" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      {summary && (
        <div className="journal-stats" style={{ marginTop: 12 }}>
          <div className="jstat">
            <div className="jstat-v">{summary.usersTraded}</div>
            <div className="jstat-l">Users Traded</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.totalTrades}</div>
            <div className="jstat-l">Total Trades</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.totalTradeAmount.toFixed(2)}</div>
            <div className="jstat-l">Trade Amount</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.totalReturnAmount.toFixed(2)}</div>
            <div className="jstat-l">Return Amount</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.totalNetProfit.toFixed(2)}</div>
            <div className="jstat-l">Net P/L</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.wins}</div>
            <div className="jstat-l">Wins</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.losses}</div>
            <div className="jstat-l">Losses</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.refunds}</div>
            <div className="jstat-l">Refunds</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.pending}</div>
            <div className="jstat-l">Pending</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.bestPair ?? "—"}</div>
            <div className="jstat-l">Best Pair</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.worstPair ?? "—"}</div>
            <div className="jstat-l">Worst Pair</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.usersWithLossWarning}</div>
            <div className="jstat-l">3-Loss Warning</div>
          </div>
          <div className="jstat">
            <div className="jstat-v">{summary.usersIgnoringDnt}</div>
            <div className="jstat-l">Ignored DNT</div>
          </div>
        </div>
      )}

      {userSummaries.length > 0 && (
        <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 220 }}>
          <table className="journal-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Trades</th>
                <th>W/L/R/P</th>
                <th>Net P/L</th>
                <th>WR</th>
                <th>Streak</th>
                <th>Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {userSummaries.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.user_name || u.user_email || u.user_id}</td>
                  <td>{u.total_trades}</td>
                  <td>
                    {u.wins}/{u.losses}/{u.refunds}/{u.pending}
                  </td>
                  <td>{u.net_pl.toFixed(2)}</td>
                  <td>{u.win_rate}%</td>
                  <td>{u.consecutive_losses}</td>
                  <td>{u.risk_status}</td>
                  <td>
                    <button
                      type="button"
                      className="jbtn"
                      onClick={() => void clearUserLock(u.user_id)}
                    >
                      Clear lock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 480 }}>
        {loading ? (
          <p className="empty-txt">Loading journal...</p>
        ) : rows.length === 0 ? (
          <p className="empty-txt">No journal rows match these filters.</p>
        ) : (
          <table className="journal-table admin-journal-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Date & Time</th>
                <th>Pair</th>
                <th>TF</th>
                <th>Mode</th>
                <th>Signal</th>
                <th>Dir</th>
                <th>Grade</th>
                <th>Conf</th>
                <th>Amount</th>
                <th>Payout</th>
                <th>Return</th>
                <th>Net</th>
                <th>Open</th>
                <th>Close</th>
                <th>Result</th>
                <th>Reason</th>
                <th>Verified</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_name ?? "—"}</td>
                  <td>{r.user_email ?? "—"}</td>
                  <td>{formatAppDateTime(r.marked_time || r.created_at)}</td>
                  <td>{r.pair}</td>
                  <td>{r.timeframe}</td>
                  <td>{r.scan_mode ?? "practice"}</td>
                  <td>{r.signal_type_label}</td>
                  <td>{r.direction}</td>
                  <td>{r.grade ?? "—"}</td>
                  <td>{r.confidence != null ? Math.round(r.confidence) : "—"}</td>
                  <td>{r.trade_amount.toFixed(2)}</td>
                  <td>{r.payout_percent}%</td>
                  <td>{r.return_amount.toFixed(2)}</td>
                  <td>{r.net_profit.toFixed(2)}</td>
                  <td>{r.olymp_opening_quote ?? "—"}</td>
                  <td>{r.olymp_closing_quote ?? "—"}</td>
                  <td>{r.result}</td>
                  <td>{r.loss_reason ?? "—"}</td>
                  <td>{r.verified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
