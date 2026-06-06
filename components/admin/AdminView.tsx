"use client";

import { formatAppDateTime } from "@/lib/datetime";
import type { PlanName } from "@/lib/billing/planLimits";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AdminTab =
  | "overview"
  | "users"
  | "assets"
  | "terms"
  | "reports"
  | "api"
  | "audit";

type OverviewMetrics = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  freeUsers: number;
  starterUsers: number;
  proUsers: number;
  termsAcceptedUsers: number;
  termsPendingUsers: number;
  totalScansToday: number;
  totalProviderCallsToday: number;
  totalCacheHitsToday: number;
  totalSignalsGenerated: number;
  totalJournalRecords: number;
};

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  plan: string;
  is_active: boolean;
  risk_disclaimer_accepted?: boolean;
  terms_accepted_version?: string | null;
  terms_accepted_at?: string | null;
  allowed_assets_count?: number | null;
  scans_today?: number;
  provider_calls_today?: number;
  cache_hits_today?: number;
  created_at: string;
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "assets", label: "Asset Access" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "reports", label: "User Reports" },
  { id: "api", label: "API Usage" },
  { id: "audit", label: "Audit Logs" },
];

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [creatingUser, setCreatingUser] = useState(false);
  const [assetsData, setAssetsData] = useState<{
    users: Array<{
      id: string;
      email: string | null;
      full_name: string | null;
      plan: string;
      is_active: boolean;
      all_pairs: string[];
      custom_access: { pair: string; is_allowed: boolean }[];
    }>;
  } | null>(null);
  const [termsData, setTermsData] = useState<{
    terms: Array<{
      id: string;
      title: string;
      version: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>;
    active?: { id: string; version: string; title: string } | null;
    acceptanceSummary?: { totalUsers: number; accepted: number; pending: number };
    acceptanceUsers?: Array<{
      id: string;
      email: string | null;
      full_name: string | null;
      plan: string;
      role: string;
      is_active: boolean;
      accepted: boolean;
      accepted_at: string | null;
    }>;
  } | null>(null);
  const [termsAcceptanceFilter, setTermsAcceptanceFilter] = useState<"all" | "accepted" | "pending">(
    "all"
  );
  const [usageData, setUsageData] = useState<{
    totals?: { scans: number; provider: number; cache: number; estimated: number };
    byPlan?: Record<string, { scans: number; provider: number; cache: number }>;
    byPair?: Record<string, number>;
    byTimeframe?: Record<string, number>;
    byUser?: Record<string, { scans: number; provider: number; cache: number }>;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedReportUser, setSelectedReportUser] = useState<string>("");
  const [report, setReport] = useState<any | null>(null);
  const [newTerms, setNewTerms] = useState({
    title: "",
    version: "",
    content: "",
    file_url: "",
    activate: true,
  });
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
    plan: "free",
    is_active: true,
  });
  const [loadingUsers, setLoadingUsers] = useState(true);

  const loadOverview = () => {
    fetch("/api/admin/overview")
      .then((r) => r.json())
      .then((json) => setOverview(json))
      .catch(() => setOverview(null));
  };

  const loadUsers = () => {
    setLoadingUsers(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => setUsers(json.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  };

  const loadAssets = () => {
    fetch("/api/admin/assets")
      .then((r) => r.json())
      .then((json) => setAssetsData(json))
      .catch(() => setAssetsData(null));
  };

  const loadTerms = () => {
    fetch("/api/admin/terms")
      .then((r) => r.json())
      .then((json) => setTermsData(json))
      .catch(() => setTermsData(null));
  };

  const loadUsage = () => {
    fetch("/api/admin/usage")
      .then((r) => r.json())
      .then((json) => setUsageData(json))
      .catch(() => setUsageData(null));
  };

  const loadAudit = () => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((json) => setAuditLogs(json.logs || []))
      .catch(() => setAuditLogs([]));
  };

  useEffect(() => {
    loadOverview();
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "assets") loadAssets();
    if (activeTab === "terms") loadTerms();
    if (activeTab === "api") loadUsage();
    if (activeTab === "audit") loadAudit();
  }, [activeTab]);

  const createUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setCreatingUser(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const json = await res.json();
    setCreatingUser(false);
    if (!res.ok) {
      toast.error(json.error || "User creation failed");
      return;
    }
    toast.success("User created");
    setNewUser({
      full_name: "",
      email: "",
      password: "",
      role: "user",
      plan: "free",
      is_active: true,
    });
    loadUsers();
    loadOverview();
  };

  const updateAssets = async (userId: string, allowedPairs: string[]) => {
    const res = await fetch("/api/admin/assets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, allowedPairs }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Asset update failed");
      return;
    }
    toast.success("Asset access updated");
    loadAssets();
    loadUsers();
  };

  const createTerms = async () => {
    if (!newTerms.title.trim() || !newTerms.version.trim()) {
      toast.error("Title and version are required");
      return;
    }
    const res = await fetch("/api/admin/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTerms),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not create terms");
      return;
    }
    toast.success("Terms created");
    setNewTerms({ title: "", version: "", content: "", file_url: "", activate: true });
    loadTerms();
    loadOverview();
  };

  const setTermsActive = async (termsId: string) => {
    const res = await fetch("/api/admin/terms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termsId, activate: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not activate terms");
      return;
    }
    toast.success("Terms activated");
    loadTerms();
    loadOverview();
  };

  const loadUserReport = async (userId: string) => {
    if (!userId) return;
    setSelectedReportUser(userId);
    const res = await fetch(`/api/admin/users/${userId}/report`);
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not load report");
      return;
    }
    setReport(json);
  };

  const updateUser = async (
    userId: string,
    patch: { plan?: PlanName; role?: string; is_active?: boolean; full_name?: string }
  ) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Update failed");
      return;
    }
    toast.success("User updated");
    loadUsers();
    loadOverview();
  };

  return (
    <div>
      <div className="journal-title" style={{ marginBottom: 16 }}>
        ADMIN DASHBOARD
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }} className="admin-tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="jbtn"
            onClick={() => setActiveTab(tab.id)}
            style={
              activeTab === tab.id
                ? { borderColor: "var(--blue)", color: "var(--blue2)" }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {!overview ? (
            <div className="empty-txt">Loading admin overview...</div>
          ) : (
            <div className="journal-stats">
              <div className="jstat">
                <div className="jstat-v" style={{ color: "var(--blue2)" }}>
                  {overview.totalUsers}
                </div>
                <div className="jstat-l">Total Users</div>
              </div>
              <div className="jstat">
                <div className="jstat-v" style={{ color: "var(--bull)" }}>
                  {overview.activeUsers}
                </div>
                <div className="jstat-l">Active Users</div>
              </div>
              <div className="jstat">
                <div className="jstat-v" style={{ color: "var(--bear)" }}>
                  {overview.suspendedUsers}
                </div>
                <div className="jstat-l">Suspended Users</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.adminUsers}</div>
                <div className="jstat-l">Admin Users</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.freeUsers}</div>
                <div className="jstat-l">Free Users</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.starterUsers}</div>
                <div className="jstat-l">Starter Users</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.proUsers}</div>
                <div className="jstat-l">Pro Users</div>
              </div>
              <div className="jstat">
                <div className="jstat-v" style={{ color: "var(--bull)" }}>
                  {overview.termsAcceptedUsers}
                </div>
                <div className="jstat-l">Terms Accepted</div>
              </div>
              <div className="jstat">
                <div className="jstat-v" style={{ color: "var(--gold2)" }}>
                  {overview.termsPendingUsers}
                </div>
                <div className="jstat-l">Terms Pending</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.totalScansToday}</div>
                <div className="jstat-l">Scans Today</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.totalProviderCallsToday}</div>
                <div className="jstat-l">Provider Calls Today</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.totalCacheHitsToday}</div>
                <div className="jstat-l">Cache Hits Today</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.totalSignalsGenerated}</div>
                <div className="jstat-l">Signals Generated</div>
              </div>
              <div className="jstat">
                <div className="jstat-v">{overview.totalJournalRecords}</div>
                <div className="jstat-l">Journal Records</div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "users" && (
        <>
          <div className="ctrl" style={{ marginTop: 16 }}>
            <div className="ctrl-title">Create User</div>
            <div className="ctrl-row">
              <div className="f">
                <label>Full Name</label>
                <input
                  value={newUser.full_name}
                  onChange={(e) => setNewUser((s) => ({ ...s, full_name: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((s) => ({ ...s, role: e.target.value }))}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="f">
                <label>Plan</label>
                <select
                  value={newUser.plan}
                  onChange={(e) => setNewUser((s) => ({ ...s, plan: e.target.value }))}
                >
                  <option value="free">free</option>
                  <option value="starter">starter</option>
                  <option value="pro">pro</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="f">
                <label>Active</label>
                <select
                  value={newUser.is_active ? "yes" : "no"}
                  onChange={(e) =>
                    setNewUser((s) => ({ ...s, is_active: e.target.value === "yes" }))
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="f">
                <label>&nbsp;</label>
                <button type="button" className="btn-scan" onClick={createUser} disabled={creatingUser}>
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>

          <div className="ctrl" style={{ marginTop: 16 }}>
            <div className="ctrl-title">Users</div>
            {loadingUsers ? (
              <p className="empty-txt">Loading users...</p>
            ) : (
              <div className="journal-table-wrap" style={{ maxHeight: 460 }}>
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Plan</th>
                      <th>Active</th>
                      <th>Terms</th>
                      <th>Assets</th>
                      <th>Scans Today</th>
                      <th>Provider</th>
                      <th>Cache</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>{u.full_name || "—"}</td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => updateUser(u.id, { role: e.target.value })}
                            style={{ fontSize: 10 }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={u.plan}
                            onChange={(e) => updateUser(u.id, { plan: e.target.value as PlanName })}
                            style={{ fontSize: 10 }}
                          >
                            <option value="free">free</option>
                            <option value="starter">starter</option>
                            <option value="pro">pro</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>{u.is_active ? "Yes" : "No"}</td>
                        <td>
                          {u.risk_disclaimer_accepted
                            ? `Yes${u.terms_accepted_version ? ` (${u.terms_accepted_version})` : ""}`
                            : "No"}
                        </td>
                        <td>{u.allowed_assets_count ?? "Default plan"}</td>
                        <td>{u.scans_today ?? 0}</td>
                        <td>{u.provider_calls_today ?? 0}</td>
                        <td>{u.cache_hits_today ?? 0}</td>
                        <td>{formatAppDateTime(u.created_at)}</td>
                        <td>
                          <button
                            type="button"
                            className="jbtn"
                            onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                          >
                            {u.is_active ? "Suspend" : "Reactivate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "assets" && (
        <div className="ctrl" style={{ marginTop: 16 }}>
          <div className="ctrl-title">Asset Access</div>
          {!assetsData ? (
            <p className="empty-txt">Loading asset access...</p>
          ) : (
            <div className="journal-table-wrap" style={{ maxHeight: 520 }}>
              <table className="journal-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Active</th>
                    <th>Allowed Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {assetsData.users.map((u) => {
                    const enabledSet = new Set(
                      (u.custom_access || [])
                        .filter((r) => r.is_allowed)
                        .map((r) => r.pair)
                    );
                    const selected =
                      enabledSet.size > 0
                        ? u.all_pairs.filter((p) => enabledSet.has(p))
                        : u.all_pairs;
                    return (
                      <tr key={u.id}>
                        <td>{u.email || u.full_name || u.id}</td>
                        <td>{u.plan}</td>
                        <td>{u.is_active ? "Yes" : "No"}</td>
                        <td style={{ whiteSpace: "normal", minWidth: 450 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {u.all_pairs.map((pair) => {
                              const isChecked =
                                enabledSet.size > 0 ? enabledSet.has(pair) : true;
                              return (
                                <label key={pair} className="result-check" style={{ fontSize: 9 }}>
                                  <input
                                    type="checkbox"
                                    defaultChecked={isChecked}
                                    onChange={(e) => {
                                      const next = new Set(selected);
                                      if (e.target.checked) next.add(pair);
                                      else next.delete(pair);
                                      updateAssets(u.id, Array.from(next));
                                    }}
                                  />
                                  {pair}
                                </label>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "terms" && (
        <>
          <div className="ctrl" style={{ marginTop: 16 }}>
            <div className="ctrl-title">Create Terms Version</div>
            <div className="ctrl-row">
              <div className="f">
                <label>Title</label>
                <input
                  value={newTerms.title}
                  onChange={(e) => setNewTerms((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>Version</label>
                <input
                  value={newTerms.version}
                  onChange={(e) => setNewTerms((s) => ({ ...s, version: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>File URL</label>
                <input
                  value={newTerms.file_url}
                  onChange={(e) => setNewTerms((s) => ({ ...s, file_url: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>Activate now</label>
                <select
                  value={newTerms.activate ? "yes" : "no"}
                  onChange={(e) =>
                    setNewTerms((s) => ({ ...s, activate: e.target.value === "yes" }))
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
            <div className="f" style={{ marginTop: 10 }}>
              <label>Content</label>
              <textarea
                value={newTerms.content}
                onChange={(e) => setNewTerms((s) => ({ ...s, content: e.target.value }))}
                style={{
                  minHeight: 130,
                  width: "100%",
                  background: "var(--p2)",
                  border: "1px solid var(--bd2)",
                  color: "var(--txt)",
                  borderRadius: 8,
                  padding: 10,
                }}
              />
            </div>
            <button type="button" className="btn-scan" onClick={createTerms}>
              Create Terms
            </button>
          </div>

          <div className="ctrl" style={{ marginTop: 16 }}>
            <div className="ctrl-title">Terms Versions</div>
            {termsData?.acceptanceSummary && (
              <p className="empty-txt">
                Active: {termsData.active?.version || "none"} | Accepted:{" "}
                {termsData.acceptanceSummary.accepted}/{termsData.acceptanceSummary.totalUsers} |
                Pending: {termsData.acceptanceSummary.pending}
              </p>
            )}
            <div className="journal-table-wrap" style={{ maxHeight: 420 }}>
              <table className="journal-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(termsData?.terms || []).map((t) => (
                    <tr key={t.id}>
                      <td>{t.version}</td>
                      <td>{t.title}</td>
                      <td>{t.is_active ? "Active" : "Inactive"}</td>
                      <td>{formatAppDateTime(t.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="jbtn"
                          onClick={() => setTermsActive(t.id)}
                          disabled={t.is_active}
                        >
                          Activate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ctrl" style={{ marginTop: 16 }}>
            <div className="ctrl-title">User T&amp;C Acceptance</div>
            {termsData?.active ? (
              <p className="empty-txt">
                Showing acceptance status for active terms v{termsData.active.version} (
                {termsData.active.title})
              </p>
            ) : (
              <p className="empty-txt">No active terms version — acceptance status unavailable.</p>
            )}
            <div className="ctrl-row" style={{ marginBottom: 10 }}>
              <div className="f">
                <label>Filter</label>
                <select
                  value={termsAcceptanceFilter}
                  onChange={(e) =>
                    setTermsAcceptanceFilter(e.target.value as "all" | "accepted" | "pending")
                  }
                >
                  <option value="all">All users</option>
                  <option value="accepted">Accepted only</option>
                  <option value="pending">Not accepted only</option>
                </select>
              </div>
            </div>
            <div className="journal-table-wrap" style={{ maxHeight: 460 }}>
              <table className="journal-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Account</th>
                    <th>T&amp;C Status</th>
                    <th>Accepted At</th>
                  </tr>
                </thead>
                <tbody>
                  {(termsData?.acceptanceUsers || [])
                    .filter((u) => {
                      if (termsAcceptanceFilter === "accepted") return u.accepted;
                      if (termsAcceptanceFilter === "pending") return !u.accepted;
                      return true;
                    })
                    .map((u) => (
                      <tr key={u.id}>
                        <td>{u.full_name || "—"}</td>
                        <td>{u.email || "—"}</td>
                        <td>{u.role}</td>
                        <td>{u.plan}</td>
                        <td>{u.is_active ? "Active" : "Suspended"}</td>
                        <td>{u.accepted ? "Accepted" : "Not accepted"}</td>
                        <td>{u.accepted_at ? formatAppDateTime(u.accepted_at) : "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {(termsData?.acceptanceUsers || []).length === 0 && (
                <p className="empty-txt">No users found.</p>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "reports" && (
        <div className="ctrl" style={{ marginTop: 16 }}>
          <div className="ctrl-title">User Reports</div>
          <div className="ctrl-row">
            <div className="f">
              <label>Select user</label>
              <select
                value={selectedReportUser}
                onChange={(e) => {
                  setSelectedReportUser(e.target.value);
                  void loadUserReport(e.target.value);
                }}
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {report && (
            <div className="journal-stats" style={{ marginTop: 12 }}>
              <div className="jstat"><div className="jstat-v">{report?.usage?.scansToday ?? 0}</div><div className="jstat-l">Scans Today</div></div>
              <div className="jstat"><div className="jstat-v">{report?.usage?.totalScans ?? 0}</div><div className="jstat-l">Total Scans</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.signalsGenerated ?? 0}</div><div className="jstat-l">Signals</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.journalRows ?? 0}</div><div className="jstat-l">Journal Rows</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.wins ?? 0}</div><div className="jstat-l">Wins</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.losses ?? 0}</div><div className="jstat-l">Losses</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.refunds ?? 0}</div><div className="jstat-l">Refunds</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.pending ?? 0}</div><div className="jstat-l">Pending</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.realTradeWinRate ?? 0}%</div><div className="jstat-l">Real Trade WR</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.bestPair ?? "—"}</div><div className="jstat-l">Best Pair</div></div>
              <div className="jstat"><div className="jstat-v">{report?.totals?.worstPair ?? "—"}</div><div className="jstat-l">Worst Pair</div></div>
            </div>
          )}
        </div>
      )}

      {activeTab === "api" && (
        <div className="ctrl" style={{ marginTop: 16 }}>
          <div className="ctrl-title">API Usage</div>
          {!usageData ? (
            <p className="empty-txt">Loading API usage...</p>
          ) : (
            <>
              <div className="journal-stats">
                <div className="jstat"><div className="jstat-v">{usageData.totals?.provider ?? 0}</div><div className="jstat-l">Provider Calls Today</div></div>
                <div className="jstat"><div className="jstat-v">{usageData.totals?.cache ?? 0}</div><div className="jstat-l">Cache Hits Today</div></div>
                <div className="jstat"><div className="jstat-v">{usageData.totals?.estimated ?? 0}</div><div className="jstat-l">Estimated Calls</div></div>
                <div className="jstat"><div className="jstat-v">{usageData.totals?.scans ?? 0}</div><div className="jstat-l">Scans Today</div></div>
              </div>
              <div className="journal-table-wrap" style={{ marginTop: 12 }}>
                <table className="journal-table">
                  <thead><tr><th>Plan</th><th>Scans</th><th>Provider</th><th>Cache</th></tr></thead>
                  <tbody>
                    {Object.entries(usageData.byPlan || {}).map(([plan, v]) => (
                      <tr key={plan}><td>{plan}</td><td>{v.scans}</td><td>{v.provider}</td><td>{v.cache}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "audit" && (
        <div className="ctrl" style={{ marginTop: 16 }}>
          <div className="ctrl-title">Audit Logs</div>
          <div className="journal-table-wrap" style={{ maxHeight: 480 }}>
            <table className="journal-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>Time</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.action}</td>
                    <td>{log.entity_type || "—"}</td>
                    <td title={log.user_id || undefined}>{log.user_name || log.user_id || "—"}</td>
                    <td>{formatAppDateTime(log.created_at)}</td>
                    <td style={{ whiteSpace: "normal", maxWidth: 360 }}>
                      <code>{JSON.stringify(log.metadata || {})}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
