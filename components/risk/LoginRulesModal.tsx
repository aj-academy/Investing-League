"use client";

import {
  PLATFORM_LOGIN_RULES,
  PLATFORM_RISK_DISCLAIMER,
} from "@/lib/platform/userCopy";

export function LoginRulesModal({
  accepting,
  onAccept,
}: {
  accepting: boolean;
  onAccept: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,12,.88)",
        zIndex: 1600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="ctrl cpp-modal"
        style={{ width: "min(640px, 96vw)", maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="ctrl-title">Welcome back to The Investing League Decision Lab</div>
        <p className="cpp-motivation">
          Discipline protects your capital. Better decisions create better results.
        </p>
        <ul className="cpp-rules-list">
          {PLATFORM_LOGIN_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p className="cpp-disclaimer">{PLATFORM_RISK_DISCLAIMER}</p>
        <button
          type="button"
          className="btn-scan"
          disabled={accepting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAccept();
          }}
        >
          {accepting ? "Saving..." : "I Understand — Start with Discipline"}
        </button>
      </div>
    </div>
  );
}
