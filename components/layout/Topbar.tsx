"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Topbar({
  scansToday = 0,
  live,
}: {
  scansToday?: number;
  live?: boolean;
}) {
  const [time, setTime] = useState("");
  const [countdown, setCountdown] = useState("");
  const [liveState, setLiveState] = useState(false);
  const router = useRouter();
  const isLive = live !== undefined ? live : liveState;

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(
        n.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (live !== undefined) return;
    fetch("/api/market/ticker")
      .then((r) => setLiveState(r.ok))
      .catch(() => setLiveState(false));
  }, [live]);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="hdr z">
      <div className="brand">
        <div className="logo">
          <span style={{ fontFamily: "var(--mono)", color: "var(--blue)", fontWeight: 700 }}>TIL</span>
        </div>
        <div>
          <div className="bname">THE INVESTING LEAGUE</div>
          <div className="bsub">Decision Lab · V4 Power Engine</div>
        </div>
      </div>
      <div className="hdr-r">
        <span className="clk">{time}</span>
        {countdown && <span className="countdown-box">{countdown}</span>}
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--m3)" }}>
          Scans today: {scansToday}
        </span>
        <div className={`pill ${isLive ? "on" : "off"}`}>
          <span className={`dot ${isLive ? "on" : "off"}`} />
          <span>{isLive ? "LIVE" : "OFFLINE"}</span>
        </div>
        <button type="button" className="btn-sm" style={{ background: "var(--p2)", border: "1px solid var(--bd2)", color: "var(--txt)" }} onClick={logout}>
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
