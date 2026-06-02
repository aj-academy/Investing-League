"use client";

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

const tabs: { id: AdminTab; label: string; enabled: boolean }[] = [
  { id: "overview", label: "Overview", enabled: true },
  { id: "users", label: "Users", enabled: true },
  { id: "assets", label: "Asset Access", enabled: false },
  { id: "terms", label: "Terms & Conditions", enabled: false },
  { id: "reports", label: "User Reports", enabled: false },
  { id: "api", label: "API Usage", enabled: false },
  { id: "audit", label: "Audit Logs", enabled: false },
];

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [creatingUser, setCreatingUser] = useState(false);
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

  useEffect(() => {
    loadOverview();
    loadUsers();
  }, []);

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

  const renderPlaceholder = (title: string) => (
    <div className="ctrl" style={{ marginTop: 16 }}>
      <div className="ctrl-title">{title}</div>
      <p className="empty-txt">Phase 2 implementation will be added here.</p>
    </div>
  );

  return (
    <div>
      <div className="journal-title" style={{ marginBottom: 16 }}>
        ADMIN DASHBOARD
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="jbtn"
            disabled={!tab.enabled}
            onClick={() => tab.enabled && setActiveTab(tab.id)}
            style={
              activeTab === tab.id
                ? { borderColor: "var(--blue)", color: "var(--blue2)" }
                : undefined
            }
          >
            {tab.label}
            {!tab.enabled ? " (Phase 2)" : ""}
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
                        <td>{new Date(u.created_at).toLocaleString()}</td>
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

      {activeTab === "assets" && renderPlaceholder("Asset Access")}
      {activeTab === "terms" && renderPlaceholder("Terms & Conditions")}
      {activeTab === "reports" && renderPlaceholder("User Reports")}
      {activeTab === "api" && renderPlaceholder("API Usage")}
      {activeTab === "audit" && renderPlaceholder("Audit Logs")}
    </div>
  );
}
