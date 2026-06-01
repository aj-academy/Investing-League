"use client";

import type { PlanName } from "@/lib/billing/planLimits";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  plan: string;
  is_active: boolean;
  created_at: string;
};

export function AdminView() {
  const [data, setData] = useState<{
    totalUsers: number;
    signalsGenerated: number;
    journalRecords: number;
    usageLogs: { action: string; mode: string; created_at: string; provider_calls?: number; cache_hits?: number }[];
  } | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const loadUsers = () => {
    setLoadingUsers(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => setUsers(json.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => {
    fetch("/api/admin/usage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
    loadUsers();
  }, []);

  const updateUser = async (userId: string, patch: { plan?: PlanName; role?: string; is_active?: boolean }) => {
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
  };

  if (!data) {
    return <div className="empty-txt">Loading admin metrics...</div>;
  }

  return (
    <div>
      <div className="journal-title" style={{ marginBottom: 16 }}>
        ADMIN DASHBOARD
      </div>
      <div className="journal-stats">
        <div className="jstat">
          <div className="jstat-v" style={{ color: "var(--blue2)" }}>
            {data.totalUsers}
          </div>
          <div className="jstat-l">Total Users</div>
        </div>
        <div className="jstat">
          <div className="jstat-v" style={{ color: "var(--gold)" }}>
            {data.signalsGenerated}
          </div>
          <div className="jstat-l">Signals Generated</div>
        </div>
        <div className="jstat">
          <div className="jstat-v" style={{ color: "var(--txt2)" }}>
            {data.journalRecords}
          </div>
          <div className="jstat-l">Journal Records</div>
        </div>
      </div>

      <div className="ctrl" style={{ marginTop: 16 }}>
        <div className="ctrl-title">User Plan Management</div>
        {loadingUsers ? (
          <p className="empty-txt">Loading users...</p>
        ) : (
          <div className="journal-table-wrap" style={{ maxHeight: 360 }}>
            <table className="journal-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Plan</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.full_name || "—"}</td>
                    <td>{u.role}</td>
                    <td>
                      <select
                        value={u.plan}
                        onChange={(e) =>
                          updateUser(u.id, { plan: e.target.value as PlanName })
                        }
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
                      <button
                        type="button"
                        className="jbtn"
                        onClick={() =>
                          updateUser(u.id, { is_active: !u.is_active })
                        }
                      >
                        Toggle active
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="ctrl" style={{ marginTop: 16 }}>
        <div className="ctrl-title">Recent Usage Logs</div>
        <div className="journal-table-wrap" style={{ maxHeight: 400 }}>
          <table className="journal-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Mode</th>
                <th>Provider</th>
                <th>Cache</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.usageLogs.map((log, i) => (
                <tr key={i}>
                  <td>{log.action}</td>
                  <td>{log.mode}</td>
                  <td>{log.provider_calls ?? "—"}</td>
                  <td>{log.cache_hits ?? "—"}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
