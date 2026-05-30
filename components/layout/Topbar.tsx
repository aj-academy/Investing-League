"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Topbar({
  usageCount = 0,
  isDemo = false,
}: {
  usageCount?: number;
  isDemo?: boolean;
}) {
  const [time, setTime] = useState("");
  const [countdown, setCountdown] = useState("");
  const [live, setLive] = useState(false);
  const router = useRouter();

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
    fetch("/api/market/candles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pair: "EUR/USD", interval: "5min", outputsize: 5 }),
    })
      .then((r) => setLive(r.ok || isDemo))
      .catch(() => setLive(false));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/demo/logout", { method: "POST" });
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (url) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch {
      /* demo-only session */
    }
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
          Scans: {usageCount}
        </span>
        <div className={`pill ${live ? "on" : "off"}`}>
          <span className={`dot ${live ? "on" : "off"}`} />
          <span>{live ? "LIVE" : "OFFLINE"}</span>
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
