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
  | "rules"
  | "pricing"
  | "reports"
  | "api"
  | "audit";

type PricingPlanRow = {
  id: string;
  name: string;
  price_label: string;
  best_for: string;
  access_description: string;
  sort_order: number;
  is_active: boolean;
  is_highlighted: boolean;
  created_at: string;
  updated_at: string;
};

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
  { id: "rules", label: "Platform Rules" },
  { id: "pricing", label: "Pricing Plans" },
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
      plan_pairs: string[];
      has_custom_access: boolean;
      custom_access: { pair: string; is_allowed: boolean }[];
    }>;
  } | null>(null);
  const [assetDrafts, setAssetDrafts] = useState<Record<string, string[]>>({});
  const [assetSavingUserId, setAssetSavingUserId] = useState<string | null>(null);
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
  const defaultRange = () => {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const weekAgo = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6)
    );
    return { from: weekAgo.toISOString().slice(0, 10), to };
  };
  const [apiFilter, setApiFilter] = useState(() => ({
    ...defaultRange(),
    userId: "",
    plan: "",
  }));
  const [reportFilter, setReportFilter] = useState(() => ({
    ...defaultRange(),
    result: "",
  }));
  const [usageData, setUsageData] = useState<{
    filter?: { from: string; to: string };
    totals?: { scans: number; provider: number; cache: number; estimated: number };
    byPlan?: Record<string, { scans: number; provider: number; cache: number }>;
    byPair?: Record<string, number>;
    byTimeframe?: Record<string, number>;
    byUser?: Record<string, { scans: number; provider: number; cache: number; email?: string }>;
    byDay?: Array<{
      date: string;
      scans: number;
      provider: number;
      cache: number;
      estimated: number;
    }>;
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
  const [pricingPlans, setPricingPlans] = useState<PricingPlanRow[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [newPricingPlan, setNewPricingPlan] = useState({
    name: "",
    price_label: "",
    best_for: "",
    access_description: "",
    sort_order: 0,
    is_active: true,
    is_highlighted: false,
  });
  const [rulesData, setRulesData] = useState<{
    active: {
      id: string;
      title: string;
      content: string;
      updated_at: string;
      created_at: string;
    } | null;
  } | null>(null);
  const [rulesDraft, setRulesDraft] = useState({ title: "Platform Rules", content: "" });
  const [savingRules, setSavingRules] = useState(false);
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

  const loadRules = () => {
    fetch("/api/admin/rules")
      .then((r) => r.json())
      .then((json) => {
        setRulesData(json);
        if (json.active) {
          setRulesDraft({
            title: json.active.title || "Platform Rules",
            content: json.active.content || "",
          });
        }
      })
      .catch(() => setRulesData(null));
  };

  const loadPricing = () => {
    setLoadingPricing(true);
    fetch("/api/admin/pricing")
      .then((r) => r.json())
      .then((json) => setPricingPlans(json.plans || []))
      .catch(() => setPricingPlans([]))
      .finally(() => setLoadingPricing(false));
  };

  const loadUsage = () => {
    const params = new URLSearchParams();
    params.set("from", apiFilter.from);
    params.set("to", apiFilter.to);
    if (apiFilter.userId) params.set("userId", apiFilter.userId);
    if (apiFilter.plan) params.set("plan", apiFilter.plan);
    fetch(`/api/admin/usage?${params.toString()}`)
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
    if (activeTab === "rules") loadRules();
    if (activeTab === "pricing") loadPricing();
    if (activeTab === "api") loadUsage();
    if (activeTab === "audit") loadAudit();
  }, [activeTab]);

  useEffect(() => {
    if (!assetsData?.users) return;
    const drafts: Record<string, string[]> = {};
    for (const u of assetsData.users) {
      const enabled = (u.custom_access || [])
        .filter((r) => r.is_allowed)
        .map((r) => r.pair);
      drafts[u.id] =
        enabled.length > 0 ? [...enabled] : [...(u.plan_pairs || u.all_pairs)];
    }
    setAssetDrafts(drafts);
  }, [assetsData]);

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

  const saveAssetDraft = async (
    userId: string,
    allowedPairs: string[],
    usePlanDefault = false
  ) => {
    setAssetSavingUserId(userId);
    const res = await fetch("/api/admin/assets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        allowedPairs: usePlanDefault ? [] : allowedPairs,
      }),
    });
    const json = await res.json();
    setAssetSavingUserId(null);
    if (!res.ok) {
      toast.error(json.error || "Asset update failed");
      return;
    }
    toast.success(usePlanDefault ? "Restored plan default assets" : "Asset access updated");
    loadAssets();
    loadUsers();
  };

  const toggleAssetDraft = (userId: string, pair: string) => {
    setAssetDrafts((prev) => {
      const current = new Set(prev[userId] || []);
      if (current.has(pair)) current.delete(pair);
      else current.add(pair);
      return { ...prev, [userId]: Array.from(current) };
    });
  };

  const resetAssetDraft = (user: {
    id: string;
    plan_pairs: string[];
    all_pairs: string[];
    custom_access: { pair: string; is_allowed: boolean }[];
  }) => {
    const enabled = (user.custom_access || [])
      .filter((r) => r.is_allowed)
      .map((r) => r.pair);
    setAssetDrafts((prev) => ({
      ...prev,
      [user.id]:
        enabled.length > 0 ? [...enabled] : [...(user.plan_pairs || user.all_pairs)],
    }));
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

  const saveRules = async () => {
    if (!rulesDraft.content.trim()) {
      toast.error("Rules content is required");
      return;
    }
    setSavingRules(true);
    const res = await fetch("/api/admin/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rulesDraft),
    });
    const json = await res.json();
    setSavingRules(false);
    if (!res.ok) {
      toast.error(json.error || "Could not save rules");
      return;
    }
    toast.success("Platform rules updated. Users will see a popup on next login.");
    loadRules();
  };

  const createPricingPlan = async () => {
    if (
      !newPricingPlan.name.trim() ||
      !newPricingPlan.price_label.trim() ||
      !newPricingPlan.best_for.trim() ||
      !newPricingPlan.access_description.trim()
    ) {
      toast.error("Plan name, price, best for, and access are required");
      return;
    }
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPricingPlan),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not create pricing plan");
      return;
    }
    toast.success("Pricing plan created");
    setNewPricingPlan({
      name: "",
      price_label: "",
      best_for: "",
      access_description: "",
      sort_order: 0,
      is_active: true,
      is_highlighted: false,
    });
    loadPricing();
  };

  const updatePricingPlan = async (
    planId: string,
    patch: Partial<
      Pick<
        PricingPlanRow,
        "name" | "price_label" | "best_for" | "access_description" | "sort_order" | "is_active" | "is_highlighted"
      >
    >
  ) => {
    const res = await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, ...patch }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not update pricing plan");
      return;
    }
    toast.success("Pricing plan updated");
    loadPricing();
  };

  const deletePricingPlan = async (planId: string) => {
    if (!window.confirm("Delete this pricing plan from the home page?")) return;
    const res = await fetch(`/api/admin/pricing?planId=${encodeURIComponent(planId)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not delete pricing plan");
      return;
    }
    toast.success("Pricing plan deleted");
    loadPricing();
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
    if (!userId) {
      setReport(null);
      return;
    }
    setSelectedReportUser(userId);
    const params = new URLSearchParams();
    params.set("from", reportFilter.from);
    params.set("to", reportFilter.to);
    if (reportFilter.result) params.set("result", reportFilter.result);
    const res = await fetch(`/api/admin/users/${userId}/report?${params.toString()}`);
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Could not load report");
      return;
    }
    setReport(json);
  };

  const downloadUserReport = () => {
    if (!selectedReportUser) {
      toast.error("Select a user first");
      return;
    }
    const params = new URLSearchParams();
    params.set("from", reportFilter.from);
    params.set("to", reportFilter.to);
    if (reportFilter.result) params.set("result", reportFilter.result);
    params.set("format", "csv");
    window.open(`/api/admin/users/${selectedReportUser}/report?${params.toString()}`, "_blank");
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
          <p className="empty-txt" style={{ marginBottom: 10 }}>
            Select assets per user and click Save. Only saved assets appear on the client dashboard.
            Use &quot;Plan default&quot; to remove custom limits.
          </p>
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
                    <th>Mode</th>
                    <th>Allowed Assets</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assetsData.users.map((u) => {
                    const draft = assetDrafts[u.id] || [];
                    const draftSet = new Set(draft);
                    const planSet = new Set(u.plan_pairs || []);
                    return (
                      <tr key={u.id}>
                        <td>{u.email || u.full_name || u.id}</td>
                        <td>{u.plan}</td>
                        <td>{u.is_active ? "Yes" : "No"}</td>
                        <td>
                          {u.has_custom_access
                            ? `Custom (${draft.length})`
                            : `Plan default (${u.plan_pairs?.length ?? 0})`}
                        </td>
                        <td style={{ whiteSpace: "normal", minWidth: 420 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {u.all_pairs.map((pair) => {
                              const onPlan = planSet.has(pair);
                              const isChecked = draftSet.has(pair);
                              return (
                                <label
                                  key={pair}
                                  className="result-check"
                                  style={{
                                    fontSize: 9,
                                    opacity: onPlan ? 1 : 0.55,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleAssetDraft(u.id, pair)}
                                  />
                                  {pair}
                                  {!onPlan ? " (off plan)" : ""}
                                </label>
                              );
                            })}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <button
                            type="button"
                            className="jbtn"
                            disabled={assetSavingUserId === u.id || draft.length === 0}
                            onClick={() => saveAssetDraft(u.id, draft)}
                          >
                            {assetSavingUserId === u.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="jbtn"
                            disabled={assetSavingUserId === u.id}
                            onClick={() => resetAssetDraft(u)}
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            className="jbtn"
                            disabled={assetSavingUserId === u.id || !u.has_custom_access}
                            onClick={() => saveAssetDraft(u.id, [], true)}
                          >
                            Plan default
                          </button>
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

      {activeTab === "rules" && (
        <div className="ctrl" style={{ marginTop: 16 }}>
          <div className="ctrl-title">Platform Rules</div>
          <p className="empty-txt" style={{ marginBottom: 10 }}>
            Rules shown to all users. When you save changes, users who have not acknowledged the
            latest version will see a popup on login.
            {rulesData?.active?.updated_at
              ? ` Last updated: ${formatAppDateTime(rulesData.active.updated_at)}`
              : ""}
          </p>
          <div className="f">
            <label>Title</label>
            <input
              value={rulesDraft.title}
              onChange={(e) => setRulesDraft((s) => ({ ...s, title: e.target.value }))}
            />
          </div>
          <div className="f" style={{ marginTop: 10 }}>
            <label>Rules content</label>
            <textarea
              value={rulesDraft.content}
              onChange={(e) => setRulesDraft((s) => ({ ...s, content: e.target.value }))}
              style={{
                minHeight: 280,
                width: "100%",
                background: "var(--p2)",
                border: "1px solid var(--bd2)",
                color: "var(--txt)",
                borderRadius: 8,
                padding: 10,
                lineHeight: 1.6,
                fontSize: 12,
              }}
            />
          </div>
          <button
            type="button"
            className="btn-scan"
            style={{ marginTop: 12 }}
            disabled={savingRules}
            onClick={saveRules}
          >
            {savingRules ? "Saving..." : "Save Platform Rules"}
          </button>
        </div>
      )}

      {activeTab === "pricing" && (
        <>
          <div className="ctrl" style={{ marginTop: 16 }}>
            <div className="ctrl-title">Create Pricing Plan</div>
            <p className="empty-txt" style={{ marginBottom: 10 }}>
              Plans shown on the home page pricing section. Users click Pay to open WhatsApp for
              enrollment.
            </p>
            <div className="ctrl-row">
              <div className="f">
                <label>Plan name</label>
                <input
                  value={newPricingPlan.name}
                  onChange={(e) => setNewPricingPlan((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>Price</label>
                <input
                  value={newPricingPlan.price_label}
                  onChange={(e) => setNewPricingPlan((s) => ({ ...s, price_label: e.target.value }))}
                  placeholder="₹999 / month"
                />
              </div>
              <div className="f">
                <label>Best for</label>
                <input
                  value={newPricingPlan.best_for}
                  onChange={(e) => setNewPricingPlan((s) => ({ ...s, best_for: e.target.value }))}
                />
              </div>
              <div className="f">
                <label>Sort order</label>
                <input
                  type="number"
                  value={newPricingPlan.sort_order}
                  onChange={(e) =>
                    setNewPricingPlan((s) => ({ ...s, sort_order: Number(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="f" style={{ marginTop: 10 }}>
              <label>Access / features</label>
              <textarea
                value={newPricingPlan.access_description}
                onChange={(e) =>
                  setNewPricingPlan((s) => ({ ...s, access_description: e.target.value }))
                }
                style={{
                  minHeight: 90,
                  width: "100%",
                  background: "var(--p2)",
                  border: "1px solid var(--bd2)",
                  color: "var(--txt)",
                  borderRadius: 8,
                  padding: 10,
                }}
              />
            </div>
            <div className="ctrl-row" style={{ marginTop: 10 }}>
              <div className="f">
                <label>Active on home page</label>
                <select
                  value={newPricingPlan.is_active ? "yes" : "no"}
                  onChange={(e) =>
                    setNewPricingPlan((s) => ({ ...s, is_active: e.target.value === "yes" }))
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="f">
                <label>Highlight as popular</label>
                <select
                  value={newPricingPlan.is_highlighted ? "yes" : "no"}
                  onChange={(e) =>
                    setNewPricingPlan((s) => ({ ...s, is_highlighted: e.target.value === "yes" }))
                  }
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
            <button type="button" className="btn-scan" onClick={createPricingPlan}>
              Create Plan
            </button>
          </div>

          <div className="ctrl" style={{ marginTop: 16 }}>
            <div className="ctrl-title">Home Page Pricing Plans</div>
            {loadingPricing ? (
              <p className="empty-txt">Loading pricing plans...</p>
            ) : (
              <div className="journal-table-wrap" style={{ maxHeight: 520 }}>
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Best For</th>
                      <th>Access</th>
                      <th>Active</th>
                      <th>Popular</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td>
                          <input
                            type="number"
                            defaultValue={plan.sort_order}
                            style={{ width: 56, fontSize: 10 }}
                            onBlur={(e) => {
                              const next = Number(e.target.value) || 0;
                              if (next !== plan.sort_order) {
                                void updatePricingPlan(plan.id, { sort_order: next });
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            defaultValue={plan.name}
                            style={{ width: 120, fontSize: 10 }}
                            onBlur={(e) => {
                              const next = e.target.value.trim();
                              if (next && next !== plan.name) {
                                void updatePricingPlan(plan.id, { name: next });
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            defaultValue={plan.price_label}
                            style={{ width: 110, fontSize: 10 }}
                            onBlur={(e) => {
                              const next = e.target.value.trim();
                              if (next && next !== plan.price_label) {
                                void updatePricingPlan(plan.id, { price_label: next });
                              }
                            }}
                          />
                        </td>
                        <td>
                          <input
                            defaultValue={plan.best_for}
                            style={{ width: 110, fontSize: 10 }}
                            onBlur={(e) => {
                              const next = e.target.value.trim();
                              if (next && next !== plan.best_for) {
                                void updatePricingPlan(plan.id, { best_for: next });
                              }
                            }}
                          />
                        </td>
                        <td style={{ whiteSpace: "normal", maxWidth: 220 }}>
                          <textarea
                            defaultValue={plan.access_description}
                            style={{
                              width: "100%",
                              minHeight: 48,
                              fontSize: 10,
                              background: "var(--p2)",
                              border: "1px solid var(--bd2)",
                              color: "var(--txt)",
                              borderRadius: 6,
                              padding: 6,
                            }}
                            onBlur={(e) => {
                              const next = e.target.value.trim();
                              if (next && next !== plan.access_description) {
                                void updatePricingPlan(plan.id, { access_description: next });
                              }
                            }}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="jbtn"
                            onClick={() =>
                              updatePricingPlan(plan.id, { is_active: !plan.is_active })
                            }
                          >
                            {plan.is_active ? "Yes" : "No"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="jbtn"
                            onClick={() =>
                              updatePricingPlan(plan.id, {
                                is_highlighted: !plan.is_highlighted,
                              })
                            }
                          >
                            {plan.is_highlighted ? "Yes" : "No"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="jbtn"
                            onClick={() => deletePricingPlan(plan.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pricingPlans.length === 0 && (
                  <p className="empty-txt">
                    No pricing plans yet. Run `supabase/migrations/pricing_plans.sql` in Supabase SQL
                    Editor, or create plans above.
                  </p>
                )}
              </div>
            )}
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
            <div className="f">
              <label>From</label>
              <input
                type="date"
                value={reportFilter.from}
                onChange={(e) =>
                  setReportFilter((s) => ({ ...s, from: e.target.value }))
                }
              />
            </div>
            <div className="f">
              <label>To</label>
              <input
                type="date"
                value={reportFilter.to}
                onChange={(e) =>
                  setReportFilter((s) => ({ ...s, to: e.target.value }))
                }
              />
            </div>
            <div className="f">
              <label>Journal result</label>
              <select
                value={reportFilter.result}
                onChange={(e) =>
                  setReportFilter((s) => ({ ...s, result: e.target.value }))
                }
              >
                <option value="">All results</option>
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Refund">Refund</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="f" style={{ alignSelf: "end" }}>
              <button
                type="button"
                className="jbtn"
                disabled={!selectedReportUser}
                onClick={() => void loadUserReport(selectedReportUser)}
              >
                Apply filters
              </button>
            </div>
            <div className="f" style={{ alignSelf: "end" }}>
              <button
                type="button"
                className="jbtn"
                disabled={!selectedReportUser}
                onClick={downloadUserReport}
              >
                Download CSV
              </button>
            </div>
          </div>
          {report && (
            <>
              <div className="journal-stats" style={{ marginTop: 12 }}>
                <div className="jstat">
                  <div className="jstat-v">{report?.usage?.scansInRange ?? 0}</div>
                  <div className="jstat-l">Scans (range)</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.usage?.providerCallsInRange ?? 0}</div>
                  <div className="jstat-l">Provider (range)</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.usage?.scansToday ?? 0}</div>
                  <div className="jstat-l">Scans Today</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.usage?.totalScans ?? 0}</div>
                  <div className="jstat-l">Total Scans</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.totals?.signalsGenerated ?? 0}</div>
                  <div className="jstat-l">Signals (range)</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.totals?.journalRows ?? 0}</div>
                  <div className="jstat-l">Journal Rows</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.totals?.wins ?? 0}</div>
                  <div className="jstat-l">Wins</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.totals?.losses ?? 0}</div>
                  <div className="jstat-l">Losses</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{report?.totals?.realTradeWinRate ?? 0}%</div>
                  <div className="jstat-l">Real Trade WR</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">
                    {(report?.allowedAssets || []).join(", ") || "—"}
                  </div>
                  <div className="jstat-l">Allowed Assets</div>
                </div>
              </div>
              <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 280 }}>
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Scan time</th>
                      <th>Mode</th>
                      <th>Pairs</th>
                      <th>Signals</th>
                      <th>Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.recentScans || []).map((s: {
                      id: string;
                      created_at: string;
                      mode: string;
                      pairs?: string[];
                      total_signals?: number;
                      provider_calls?: number;
                    }) => (
                      <tr key={s.id}>
                        <td>{formatAppDateTime(s.created_at)}</td>
                        <td>{s.mode}</td>
                        <td>{(s.pairs || []).join(", ")}</td>
                        <td>{s.total_signals ?? 0}</td>
                        <td>{s.provider_calls ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 280 }}>
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Pair</th>
                      <th>Result</th>
                      <th>Type</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.recentJournal || []).map((j: {
                      created_at: string;
                      pair: string;
                      result: string;
                      signal_type?: string;
                      grade?: string;
                    }) => (
                      <tr key={`${j.created_at}-${j.pair}`}>
                        <td>{formatAppDateTime(j.created_at)}</td>
                        <td>{j.pair}</td>
                        <td>{j.result}</td>
                        <td>{j.signal_type || "—"}</td>
                        <td>{j.grade || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "api" && (
        <div className="ctrl" style={{ marginTop: 16 }}>
          <div className="ctrl-title">API Usage</div>
          <div className="ctrl-row">
            <div className="f">
              <label>From</label>
              <input
                type="date"
                value={apiFilter.from}
                onChange={(e) => setApiFilter((s) => ({ ...s, from: e.target.value }))}
              />
            </div>
            <div className="f">
              <label>To</label>
              <input
                type="date"
                value={apiFilter.to}
                onChange={(e) => setApiFilter((s) => ({ ...s, to: e.target.value }))}
              />
            </div>
            <div className="f">
              <label>User</label>
              <select
                value={apiFilter.userId}
                onChange={(e) => setApiFilter((s) => ({ ...s, userId: e.target.value }))}
              >
                <option value="">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label>Plan</label>
              <select
                value={apiFilter.plan}
                onChange={(e) => setApiFilter((s) => ({ ...s, plan: e.target.value }))}
              >
                <option value="">All plans</option>
                <option value="free">free</option>
                <option value="starter">starter</option>
                <option value="pro">pro</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="f" style={{ alignSelf: "end" }}>
              <button type="button" className="jbtn" onClick={loadUsage}>
                Apply filters
              </button>
            </div>
          </div>
          {!usageData ? (
            <p className="empty-txt">Loading API usage...</p>
          ) : (
            <>
              <div className="journal-stats" style={{ marginTop: 12 }}>
                <div className="jstat">
                  <div className="jstat-v">{usageData.totals?.provider ?? 0}</div>
                  <div className="jstat-l">Provider Calls</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{usageData.totals?.cache ?? 0}</div>
                  <div className="jstat-l">Cache Hits</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{usageData.totals?.estimated ?? 0}</div>
                  <div className="jstat-l">Estimated Calls</div>
                </div>
                <div className="jstat">
                  <div className="jstat-v">{usageData.totals?.scans ?? 0}</div>
                  <div className="jstat-l">Scans</div>
                </div>
              </div>
              <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 260 }}>
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Scans</th>
                      <th>Provider</th>
                      <th>Cache</th>
                      <th>Estimated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usageData.byDay || []).map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{row.scans}</td>
                        <td>{row.provider}</td>
                        <td>{row.cache}</td>
                        <td>{row.estimated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="journal-table-wrap" style={{ marginTop: 12 }}>
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Scans</th>
                      <th>Provider</th>
                      <th>Cache</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(usageData.byPlan || {}).map(([plan, v]) => (
                      <tr key={plan}>
                        <td>{plan}</td>
                        <td>{v.scans}</td>
                        <td>{v.provider}</td>
                        <td>{v.cache}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Object.keys(usageData.byUser || {}).length > 0 && (
                <div className="journal-table-wrap" style={{ marginTop: 12, maxHeight: 260 }}>
                  <table className="journal-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Scans</th>
                        <th>Provider</th>
                        <th>Cache</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(usageData.byUser || {}).map(([uid, v]) => (
                        <tr key={uid}>
                          <td>{v.email || uid}</td>
                          <td>{v.scans}</td>
                          <td>{v.provider}</td>
                          <td>{v.cache}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
