"use client";

export function DataProviderStatus({
  connected,
  demo = false,
}: {
  connected: boolean;
  demo?: boolean;
}) {
  return (
    <div className="key-box provider-box z">
      <div className="key-top">
        <h3>DATA PROVIDER STATUS</h3>
        <span className="key-badge">SERVER-SECURED</span>
      </div>
      <div className="key-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        <div style={{ fontSize: 11, color: "var(--m3)" }}>
          Provider: <strong style={{ color: "var(--txt2)" }}>Twelve Data</strong>
        </div>
        <div style={{ fontSize: 11, color: "var(--m3)" }}>
          Source: Server-secured market data
        </div>
        <div
          className={connected ? "provider-status" : "provider-status provider-off"}
          style={{ marginTop: 4 }}
        >
          Status:{" "}
          {connected
            ? demo
              ? "● Connected (demo synthetic data)"
              : "● Connected"
            : "○ Not configured"}
        </div>
      </div>
    </div>
  );
}
