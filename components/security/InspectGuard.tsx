"use client";

import { useCallback, useEffect, useState } from "react";

type InspectGuardProps = {
  /** Block inspect / right-click when true. Admins should pass enabled={false}. */
  enabled?: boolean;
};

function isInspectShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  return (
    key === "f12" ||
    (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
    (event.metaKey && event.altKey && key === "i") ||
    (event.ctrlKey && key === "u")
  );
}

/**
 * Deters casual right-click / devtools access for regular users.
 * Admins are exempt. This is client-side only and can be bypassed by technical users.
 */
export function InspectGuard({ enabled = true }: InspectGuardProps) {
  const [open, setOpen] = useState(false);
  const [clientIp, setClientIp] = useState<string | null>(null);

  const showBlocked = useCallback(() => {
    if (!enabled) return;
    setOpen(true);
    if (clientIp) return;
    fetch("/api/security/client-ip", { cache: "no-store" })
      .then((res) => res.json())
      .then((json: { ip?: string }) => setClientIp(json.ip || null))
      .catch(() => setClientIp(null));
  }, [enabled, clientIp]);

  useEffect(() => {
    if (!enabled) return;

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      showBlocked();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isInspectShortcut(event)) return;
      event.preventDefault();
      showBlocked();
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, showBlocked]);

  if (!enabled || !open) return null;

  return (
    <div className="inspect-guard-backdrop" role="dialog" aria-modal="true" aria-labelledby="inspect-guard-title">
      <div className="inspect-guard-card">
        <h2 id="inspect-guard-title" className="inspect-guard-title">
          Access Blocked
        </h2>
        <p className="inspect-guard-text">
          Developer tools and page inspection are disabled on this platform.
          <br />
          If you need technical access, contact the admin.
        </p>
        {clientIp && (
          <div className="inspect-guard-ip-box">
            Your IP: <strong>{clientIp}</strong>
          </div>
        )}
        {clientIp && <p className="inspect-guard-ip-note">Your IP address has been noted.</p>}
        <button type="button" className="inspect-guard-close" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </div>
  );
}
