"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { DISCLAIMER } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const needsSetup = searchParams.get("setup") === "supabase";

  return (
    <div className="auth-wrap z">
      <Link
        href="/"
        className="auth-home-link"
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          fontSize: 12,
          color: "var(--blue2)",
          textDecoration: "none",
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        ← Home
      </Link>
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
        <p style={{ fontSize: 11, color: "var(--m3)", marginBottom: 8 }}>Decision Lab</p>
        <p style={{ fontSize: 10, color: "var(--m3)", marginBottom: 16, lineHeight: 1.6 }}>
          Sign in with credentials provided by our team after plan enrollment.{" "}
          <Link href="/#pricing" style={{ color: "var(--blue2)" }}>
            View plans
          </Link>
        </p>
        <LoginForm />
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
