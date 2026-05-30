"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { DISCLAIMER } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const searchParams = useSearchParams();
  const needsSetup = searchParams.get("setup") === "supabase";

  return (
    <div className="auth-wrap z">
      <div className="auth-card">
        {needsSetup && (
          <div
            className="key-msg show err"
            style={{ display: "block", marginBottom: 14 }}
          >
            Supabase is not configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code>, add your project URL and anon key, then restart{" "}
            <code>npm run dev</code>.
          </div>
        )}
        <h1>THE INVESTING LEAGUE</h1>
        <p style={{ fontSize: 11, color: "var(--m3)", marginBottom: 16 }}>Decision Lab</p>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            onClick={() => setTab("signup")}
          >
            Sign Up
          </button>
        </div>
        {tab === "login" ? <LoginForm /> : <SignupForm />}
        <p style={{ fontSize: 9, color: "var(--m3)", marginTop: 16, lineHeight: 1.6 }}>{DISCLAIMER}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
