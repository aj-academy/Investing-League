"use client";

import { formatClockTime, resolveTimeZone, timeZoneAbbreviation } from "@/lib/datetime";
import { useEffect, useState } from "react";
import { clearAdminSession } from "@/lib/auth/clearAdminSession";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type MarketPill = "live" | "cached" | "offline";

export function Topbar({
  scansToday = 0,
  live,
  countdown = 0,
  timeZone: timeZoneProp,
  timeZoneLabel: timeZoneLabelProp,
}: {
  scansToday?: number;
  live?: boolean;
  countdown?: number;
  timeZone?: string;
  timeZoneLabel?: string;
}) {
  const [timeZone] = useState(() =>
    resolveTimeZone(
      timeZoneProp ||
        (typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : undefined)
    )
  );
  const tzLabel = timeZoneLabelProp || timeZoneAbbreviation(timeZone);
  const [time, setTime] = useState("");
  const [pill, setPill] = useState<MarketPill>("cached");
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      setTime(formatClockTime(new Date(), timeZone));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  useEffect(() => {
    if (live === true) {
      setPill("live");
      return;
    }

    let cancelled = false;
    const loadStatus = () => {
      fetch("/api/market/status", { cache: "no-store" })
        .then((r) => r.json())
        .then((json) => {
          if (cancelled) return;
          if (!json.ok || !json.configured) {
            setPill("offline");
            return;
          }
          setPill("cached");
        })
        .catch(() => {
          if (!cancelled) setPill("offline");
        });
    };

    const delayId = window.setTimeout(loadStatus, 0);
    const intervalId = window.setInterval(loadStatus, 60_000);
    return () => {
      cancelled = true;
      window.clearTimeout(delayId);
      window.clearInterval(intervalId);
    };
  }, [live]);

  const pillLabel =
    pill === "live" ? "LIVE" : pill === "cached" ? "CACHED" : "OFFLINE";
  const pillOn = pill === "live" || countdown > 0;

  const logout = async () => {
    const supabase = createClient();
    await Promise.all([clearAdminSession(), supabase.auth.signOut()]);
    router.replace("/login");
  };

  return (
    <header className="hdr z">
      <div className="brand">
        <div className="logo">
          <span style={{ fontFamily: "var(--mono)", color: "var(--blue)", fontWeight: 700 }}>TIL</span>
        </div>
        <div>
          <div className="bname">THE INVESTING LEAGUE</div>
          <div className="bsub">Decision Lab · V8 Clean Engine</div>
        </div>
      </div>
      <div className="hdr-r">
        <span className="clk" title={`Local time (${timeZone})`}>
          {time} <span style={{ fontSize: 9, color: "var(--m3)" }}>{tzLabel}</span>
        </span>
        {countdown > 0 && (
          <span
            className="countdown-box"
            style={{
              borderColor: countdown <= 5 ? "rgba(0,214,143,.35)" : "rgba(240,160,32,.35)",
              color: countdown <= 5 ? "var(--bull)" : "var(--gold2)",
            }}
          >
            {countdown <= 0 ? "REFRESHING..." : `REFRESH IN ${countdown}s`}
          </span>
        )}
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--m3)" }}>
          Scans today: {scansToday}
        </span>
        <div className={`pill ${pillOn ? "on" : "off"}`} title="Live signal engine active when scanning">
          <span className={`dot ${pillOn ? "on" : "off"}`} />
          <span>{pillLabel}</span>
        </div>
        <button
          type="button"
          className="btn-sm"
          style={{ background: "var(--p2)", border: "1px solid var(--bd2)", color: "var(--txt)" }}
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export function useCountdown(seconds: number, active: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active || seconds <= 0) {
      setText("");
      return;
    }
    let left = seconds;
    setText(`REFRESH IN ${left}s`);
    const id = setInterval(() => {
      left--;
      if (left <= 0) setText("REFRESHING...");
      else setText(`REFRESH IN ${left}s`);
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, active]);
  return text;
}
