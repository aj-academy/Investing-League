"use client";

import { createClient } from "@/lib/supabase/client";
import { clearAdminSession } from "@/lib/auth/clearAdminSession";
import { formatAppDateTime } from "@/lib/datetime";
import { useRouter } from "next/navigation";

export type RulesModalContent = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

export function RulesModal({
  rules,
  required,
  acknowledging,
  onAcknowledge,
  onClose,
}: {
  rules: RulesModalContent;
  required: boolean;
  acknowledging: boolean;
  onAcknowledge: () => void;
  onClose?: () => void;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,12,.82)",
        zIndex: 1500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={required ? undefined : onClose}
    >
      <div
        className="ctrl"
        style={{ width: "min(900px, 96vw)", maxHeight: "86vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ctrl-title">
          {required ? "Platform Rules — Acknowledgement Required" : rules.title}
        </div>
        <p style={{ fontSize: 11, color: "var(--m3)", marginBottom: 10 }}>
          Last updated: {formatAppDateTime(rules.updated_at)}
        </p>
        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 11,
            color: "var(--txt2)",
            lineHeight: 1.6,
            border: "1px solid var(--bd)",
            borderRadius: 8,
            background: "var(--p2)",
            padding: 12,
            maxHeight: 360,
            overflow: "auto",
          }}
        >
          {rules.content}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          {required ? (
            <>
              <button
                type="button"
                className="btn-scan"
                disabled={acknowledging}
                onClick={onAcknowledge}
              >
                {acknowledging ? "Saving..." : "I Have Read & Acknowledge"}
              </button>
              <button
                type="button"
                className="jbtn"
                onClick={async () => {
                  const supabase = createClient();
                  await Promise.all([clearAdminSession(), supabase.auth.signOut()]);
                  router.replace("/login");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button type="button" className="btn-scan" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
