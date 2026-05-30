"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function loginErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Confirm your email first (check inbox/spam), then sign in again.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "Wrong email or password — or your email is not confirmed yet. Check inbox or reset password.";
  }
  return message;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(loginErrorMessage(error.message));
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Unable to sign in. Check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email above, then click Forgot password.");
      return;
    }
    setResetLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password reset email sent. Check your inbox.");
    } catch {
      toast.error("Could not send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <button
        type="button"
        className="auth-link-btn"
        disabled={resetLoading}
        onClick={resetPassword}
        style={{ marginTop: 10, width: "100%", background: "transparent", border: "none", color: "var(--m3)", fontSize: 10, cursor: "pointer" }}
      >
        {resetLoading ? "Sending..." : "Forgot password?"}
      </button>
    </form>
  );
}
