"use client";

import { DatePickerField } from "@/components/ui/DatePickerField";
import { formatAppDateTime } from "@/lib/datetime";
import { JOURNAL_PERMISSION_FILTER_LABEL, JOURNAL_PERMISSION_OPTIONS, JOURNAL_RESULT_OPTIONS, JOURNAL_SETUP_TYPE_OPTIONS, todayDateInputValue, type JournalFilterState } from "@/lib/journal/journalFilters";
import { permissionClass } from "@/lib/journal/journalDisplay";
import { PAIRS } from "@/lib/utils";
import type {
  AdminJournalRow,
  AdminJournalSummary,
  AdminUserJournalSummary,
} from "@/lib/admin/adminJournal";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function permissionShortLabel(perm: string) {
  if (perm === "TRADE ALLOWED") return "Allowed";
  if (perm === "OBSERVE ONLY") return "Observe";
  if (perm === "DO NOT TRADE") return "DNT";
  return perm;
}

type AdminJournalUser = {
  id: string;
  email: string | null;
  full_name: string | null;
};

function userOptionLabel(u: AdminJournalUser) {
  if (u.full_name?.trim()) return u.full_name.trim();
  return u.email || u.id;
}

export function AdminJournalTab() {
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [users, setUsers] = useState<AdminJournalUser[]>([]);
  const [rows, setRows] = useState<AdminJournalRow[]>([]);
  const [summary, setSummary] = useState<AdminJournalSummary | null>(null);
  const [userSummaries, setUserSummaries] = useState<AdminUserJournalSummary[]>([]);
  const [filters, setFilters] = useState({
    userId: "",
    from: "",
    to: "",
    pair: "",
    result: "",
    permission: "",
    signalType: "",
    mode: "",
    timeframe: "",
    plan: "",
    verifiedOnly: false,
    pendingOnly: false,
  });

  useEffect(() => {
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.users || []) as AdminJournalUser[];
        setUsers(
          [...list].sort((a, b) => userOptionLabel(a).localeCompare(userOptionLabel(b))),
        );
      })
      .catch(() => {
        toast.error("Could not load users for filter");
      })
      .finally(() => setUsersLoading(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.pair) params.set("pair", filters.pair);
    if (filters.result) params.set("result", filters.result);
    if (filters.permission) params.set("permission", filters.permission);
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
      body: JSON.stringify({ action: "admin_activate_live", userId }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not activate live mode");
      return;
    }
    toast.success("Live mode activated for user");
    void load();
  };

  return (
    <div className="ctrl admin-panel" style={{ marginTop: 16 }}>
      <div className="ctrl-title">Admin Journal</div>
      <p className="admin-page-sub" style={{ marginBottom: 12 }}>
        Complete journal across all users with capital and discipline filters.
      </p>

      <div className="journal-filters admin-journal-filters">
        <div className="journal-filters-main">
          <div className="f">
            <label>User</label>
            <select
              className="journal-filter-select"
              value={filters.userId}
              disabled={usersLoading}
              onChange={(e) => setFilters((s) => ({ ...s, userId: e.target.value }))}
            >
              <option value="">{usersLoading ? "Loading users…" : "All users"}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {userOptionLabel(u)}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label>From date</label>
            <DatePickerField
              className="journal-filter-date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(from) => setFilters((s) => ({ ...s, from }))}
            />
          </div>
          <div className="f">
            <label>To date</label>
            <DatePickerField
              className="journal-filter-date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(to) => setFilters((s) => ({ ...s, to }))}
            />
          </div>
          <div className="f">
            <label>{JOURNAL_PERMISSION_FILTER_LABEL}</label>
            <select
              className="journal-filter-select"
              value={filters.permission}
              onChange={(e) => setFilters((s) => ({ ...s, permission: e.target.value }))}
            >
              {JOURNAL_PERMISSION_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label>Asset / pair</label>
            <select
              className="journal-filter-select"
              value={filters.pair}
              onChange={(e) => setFilters((s) => ({ ...s, pair: e.target.value }))}
            >
              <option value="">All pairs</option>
              {PAIRS.map((pair) => (
                <option key={pair} value={pair}>
                  {pair}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label>Result</label>
            <select
              className="journal-filter-select"
              value={filters.result}
              onChange={(e) => setFilters((s) => ({ ...s, result: e.target.value }))}
            >
              {JOURNAL_RESULT_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label>Setup type</label>
            <select
              className="journal-filter-select"
              value={filters.signalType}
              onChange={(e) => setFilters((s) => ({ ...s, signalType: e.target.value }))}
            >
              {JOURNAL_SETUP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label>Scan mode</label>
            <select
              className="journal-filter-select"
              value={filters.mode}
              onChange={(e) => setFilters((s) => ({ ...s, mode: e.target.value }))}
            >
              <option value="">All modes</option>
              <option value="practice">Practice</option>
              <option value="live">Live</option>
            </select>
          </div>
          <div className="f">
            <label>Timeframe</label>
            <select
              className="journal-filter-select"
              value={filters.timeframe}
              onChange={(e) => setFilters((s) => ({ ...s, timeframe: e.target.value }))}
            >
              <option value="">All</option>
              <option value="2min">2min</option>
              <option value="5min">5min</option>
              <option value="15min">15min</option>
            </select>
          </div>
          <div className="f">
            <label>Plan</label>
            <select
              className="journal-filter-select"
              value={filters.plan}
              onChange={(e) => setFilters((s) => ({ ...s, plan: e.target.value }))}
            >
              <option value="">All plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        <div className="journal-filters-quick">
          <span className="journal-filter-count">
            {loading ? "Loading…" : (
              <>
                <strong>{rows.length}</strong> row{rows.length === 1 ? "" : "s"}
              </>
            )}
          </span>
          <button
            type="button"
            className="journal-filter-chip"
            onClick={() =>
              setFilters((s) => ({
                ...s,
                permission: "TRADE ALLOWED",
                result: "Pending",
              }))
            }
          >
            Allowed · pending
          </button>
          <button
            type="button"
            className="journal-filter-chip"
            onClick={() => setFilters((s) => ({ ...s, permission: "TRADE ALLOWED", result: "" }))}
          >
            Allowed only
          </button>
          <label className="journal-filter-check">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(e) => setFilters((s) => ({ ...s, verifiedOnly: e.target.checked }))}
            />
            Verified only
          </label>
          <label className="journal-filter-check">
            <input
              type="checkbox"
              checked={filters.pendingOnly}
              onChange={(e) => setFilters((s) => ({ ...s, pendingOnly: e.target.checked }))}
            />
            Pending only
          </label>
          <button type="button" className="jbtn" onClick={() => void load()}>
            Refresh
          </button>
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
                <th>Start Cap.</th>
                <th>Current</th>
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
                  <td>{(u.starting_capital ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{(u.current_capital ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
                      Activate live
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
                <th>Level</th>
                <th>Setup</th>
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
                  <td>
                    <span className={`permission-pill ${permissionClass(r.permission)}`}>
                      {permissionShortLabel(r.permission)}
                    </span>
                  </td>
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
