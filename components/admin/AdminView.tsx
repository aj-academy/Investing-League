"use client";

import { useEffect, useState } from "react";

export function AdminView() {
  const [data, setData] = useState<{
    totalUsers: number;
    signalsGenerated: number;
    journalRecords: number;
    usageLogs: unknown[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/usage")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

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
        <div className="ctrl-title">Recent Usage Logs</div>
        <div className="journal-table-wrap" style={{ maxHeight: 400 }}>
          <table className="journal-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Mode</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(data.usageLogs as { action: string; mode: string; created_at: string }[]).map(
                (log, i) => (
                  <tr key={i}>
                    <td>{log.action}</td>
                    <td>{log.mode}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
