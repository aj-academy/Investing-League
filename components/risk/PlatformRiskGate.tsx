"use client";

import {
  PLATFORM_RULES_SAVE_FAILED,
  PLATFORM_RULES_SAVE_PENDING,
} from "@/lib/platform/userCopy";
import { sanitizeServiceWarning } from "@/lib/platform/sanitizeUserFacingError";
import { todayDateString } from "@/lib/risk/capitalProtection";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoginRulesModal } from "./LoginRulesModal";

const LOGIN_RULES_STORAGE_KEY = "til_login_rules_seen_date";

function readLocalSeenDate(): string | null {
  try {
    return sessionStorage.getItem(LOGIN_RULES_STORAGE_KEY);
  } catch {
    return null;
  }
}

function markLocalSeenToday() {
  try {
    sessionStorage.setItem(LOGIN_RULES_STORAGE_KEY, todayDateString());
  } catch {
    /* ignore */
  }
}

export function PlatformRiskGate({ children }: { children: React.ReactNode }) {
  const [showLoginRules, setShowLoginRules] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const today = todayDateString();
    if (readLocalSeenDate() === today) {
      setShowLoginRules(false);
      setChecked(true);
      return;
    }

    fetch("/api/login-rules", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && !json.showPopup) {
          markLocalSeenToday();
          setShowLoginRules(false);
        } else {
          setShowLoginRules(Boolean(json.showPopup));
        }
        setChecked(true);
      })
      .catch(() => {
        setChecked(true);
      });
  }, []);

  const acceptRules = useCallback(async () => {
    if (accepting) return;

    setAccepting(true);
    markLocalSeenToday();
    setShowLoginRules(false);

    try {
      const res = await fetch("/api/login-rules", { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        toast.error(sanitizeServiceWarning(json.error) || PLATFORM_RULES_SAVE_FAILED);
        return;
      }

      if (!json.persisted && json.warning) {
        toast.message(PLATFORM_RULES_SAVE_PENDING);
      }
    } catch {
      toast.error("Network error — popup closed for this session.");
    } finally {
      setAccepting(false);
    }
  }, [accepting]);

  if (!checked) return children;

  return (
    <>
      {children}
      {showLoginRules && <LoginRulesModal accepting={accepting} onAccept={() => void acceptRules()} />}
    </>
  );
}
