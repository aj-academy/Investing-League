"use client";

import { useCallback, useEffect, useState } from "react";
import { LoginRulesModal } from "./LoginRulesModal";

export function PlatformRiskGate({ children }: { children: React.ReactNode }) {
  const [showLoginRules, setShowLoginRules] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/login-rules")
      .then((r) => r.json())
      .then((json) => {
        setShowLoginRules(Boolean(json.showPopup));
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  const acceptRules = useCallback(async () => {
    setAccepting(true);
    try {
      const res = await fetch("/api/login-rules", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) return;
      setShowLoginRules(false);
    } finally {
      setAccepting(false);
    }
  }, []);

  if (!checked) return children;

  return (
    <>
      {children}
      {showLoginRules && <LoginRulesModal accepting={accepting} onAccept={acceptRules} />}
    </>
  );
}
