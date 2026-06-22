"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { PLATFORM_DISCLAIMER, PLATFORM_SETUP_REQUIRED } from "@/lib/platform/userCopy";
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
            {PLATFORM_SETUP_REQUIRED}
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
        <p style={{ fontSize: 9, color: "var(--m3)", marginTop: 16, lineHeight: 1.6 }}>{PLATFORM_DISCLAIMER}</p>
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
