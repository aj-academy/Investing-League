"use client";

type Segment = { label: string; value: number; color: string };

export function AnalyticsDonut({
  segments,
  centerLabel,
}: {
  segments: Segment[];
  centerLabel?: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (total === 0) {
    return (
      <div className="analytics-donut-wrap">
        <div className="analytics-donut empty">No data</div>
      </div>
    );
  }

  let acc = 0;
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    });

  return (
    <div className="analytics-donut-wrap">
      <div
        className="analytics-donut"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="analytics-donut-core">
          <span>{centerLabel ?? total}</span>
          <small>signals</small>
        </div>
      </div>
      <ul className="analytics-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="analytics-legend-dot" style={{ background: s.color }} />
            {s.label} <strong>{s.value}</strong>
            <span className="analytics-legend-pct">
              ({Math.round((s.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsBarRow({
  label,
  value,
  max = 100,
  suffix = "%",
  tone = "blue",
}: {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  tone?: "blue" | "bull" | "bear" | "gold" | "purple";
}) {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="analytics-bar-row">
      <div className="analytics-bar-label">{label}</div>
      <div className="analytics-bar-track">
        <div
          className={`analytics-bar-fill tone-${tone}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="analytics-bar-val">
        {suffix === "%" ? `${value}%` : `${value}${suffix}`}
      </div>
    </div>
  );
}

export function AnalyticsStackedBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  if (!total) return <p className="analytics-empty">Not enough data yet</p>;

  return (
    <div className="analytics-stacked">
      <div className="analytics-stacked-bar">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.label}
              className="analytics-stacked-seg"
              style={{
                flex: s.value,
                background: s.color,
              }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null
        )}
      </div>
      <ul className="analytics-legend compact">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="analytics-legend-dot" style={{ background: s.color }} />
            {s.label} <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RiskMeter({
  level,
  reason,
}: {
  level: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}) {
  const idx = level === "LOW" ? 0 : level === "MEDIUM" ? 1 : 2;
  return (
    <div className="analytics-risk-meter">
      <div className="analytics-risk-label">Risk meter</div>
      <div className="analytics-risk-track">
        {["LOW", "MEDIUM", "HIGH"].map((l, i) => (
          <div
            key={l}
            className={`analytics-risk-seg ${i === idx ? "active" : ""} risk-${l.toLowerCase()}`}
          >
            {l}
          </div>
        ))}
      </div>
      <p className="analytics-risk-reason">{reason}</p>
    </div>
  );
}
