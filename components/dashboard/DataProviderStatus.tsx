"use client";

export function DataProviderStatus({
  configured,
  live,
  hint,
}: {
  configured: boolean;
  live?: boolean;
  hint?: string | null;
}) {
  const statusLabel = !configured
    ? "○ API key not set on server"
    : live
      ? "● Connected"
      : "○ Offline (market data unavailable)";

  return (
    <div className="key-box provider-box z">
      <div className="key-top">
        <h3>DATA PROVIDER STATUS</h3>
        <span className="key-badge">SERVER-SECURED</span>
      </div>
      <div className="key-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
        <div style={{ fontSize: 11, color: "var(--m3)" }}>
          Feed: <strong style={{ color: "var(--txt2)" }}>Server-secured market data</strong>
        </div>
        <div
          className={configured && live ? "provider-status" : "provider-status provider-off"}
          style={{ marginTop: 4 }}
        >
          Status: {statusLabel}
        </div>
        {hint && (
          <div style={{ fontSize: 10, color: "var(--bear)", marginTop: 6, lineHeight: 1.5 }}>{hint}</div>
        )}
      </div>
    </div>
  );
}
