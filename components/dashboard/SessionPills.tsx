import { SESSION_LABELS, getCurrentSession } from "@/lib/signal-engine/session";

export function SessionPills() {
  const active = getCurrentSession().map((s) => s.s);
  return (
    <div className="sessions">
      {SESSION_LABELS.map((s) => {
        const on = active.includes(s.s);
        const hot = on && (s.s === "overlap" || s.s === "london" || s.s === "newyork");
        return (
          <div key={s.s} className={`sess ${on ? (hot ? "hot" : "active") : ""}`}>
            <div className="sess-dot" />
            {s.n}
          </div>
        );
      })}
    </div>
  );
}
