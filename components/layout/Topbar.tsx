"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type MarketPill = "live" | "cached" | "offline";

export function Topbar({
  scansToday = 0,
  live,
}: {
  scansToday?: number;
  live?: boolean;
}) {
  const [time, setTime] = useState("");
  const [pill, setPill] = useState<MarketPill>("cached");
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
    if (live === true) {
      setPill("live");
      return;
    }
    if (live === false) {
      fetch("/api/market/status")
        .then((r) => r.json())
        .then((json) => {
          if (!json.ok) {
            setPill("offline");
            return;
          }
          if (json.canPollLive) setPill("cached");
          else if (json.configured) setPill("cached");
          else setPill("offline");
        })
        .catch(() => setPill("offline"));
      return;
    }

    fetch("/api/market/status")
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok || !json.configured) {
          setPill("offline");
          return;
        }
        setPill(json.canPollLive ? "cached" : "cached");
      })
      .catch(() => setPill("offline"));
  }, [live]);

  const pillLabel =
    pill === "live" ? "LIVE" : pill === "cached" ? "CACHED" : "OFFLINE";
  const pillOn = pill === "live";

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
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--m3)" }}>
          Scans today: {scansToday}
        </span>
        <div className={`pill ${pillOn ? "on" : "off"}`} title="Market data mode (not an error)">
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
