"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [adminPanel, setAdminPanel] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canQuickUnlock, setCanQuickUnlock] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("admin") !== "1") return;
    setAdminPanel(true);
    toast.message("Enter admin credentials to unlock the admin panel.");
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setCanQuickUnlock(Boolean(user));
    });
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPanel && email.trim().toLowerCase() === "open-admin") {
      setEmail("");
      setPassword("");
      setAdminPanel(true);
      toast.message("Admin panel unlocked. Enter admin credentials.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const signInEmail = adminPanel ? adminEmail.trim() : email.trim();
      const signInPassword = adminPanel ? adminPassword : password;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });
      if (error) {
        toast.error(loginErrorMessage(error.message));
        return;
      }

      if (adminPanel) {
        if (!data.session) {
          await supabase.auth.signOut();
          toast.error("Admin login failed. Try again.");
          return;
        }

        // Cookie must be set via document navigation — fetch ignores Set-Cookie.
        window.location.assign("/auth/admin-unlock");
        return;
      }

      const accessToken = data.session?.access_token;
      if (accessToken) {
        const roleRes = await fetch("/api/auth/is-admin", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const roleJson = (await roleRes.json()) as { isAdmin?: boolean };
        if (roleRes.ok && roleJson.isAdmin) {
          await supabase.auth.signOut();
          toast.error(
            "Admin accounts must use the admin sign-in. Type open-admin in the email field first.",
          );
          return;
        }
      }

      router.replace("/dashboard");
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
        redirectTo: `${window.location.origin}/auth/callback?next=/login`,
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
      {!adminPanel && (
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      )}
      {adminPanel ? (
        <>
          <input
            type="email"
            placeholder="Admin Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
        </>
      ) : (
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      )}
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : adminPanel ? "Admin Sign In" : "Sign In"}
      </button>
      {adminPanel && canQuickUnlock && (
        <button
          type="button"
          className="auth-link-btn"
          disabled={loading}
          onClick={() => window.location.assign("/auth/admin-unlock")}
          style={{
            marginTop: 8,
            width: "100%",
            background: "var(--blued)",
            border: "1px solid rgba(0,170,255,.25)",
            color: "var(--blue2)",
            fontSize: 11,
            fontWeight: 600,
            padding: "10px 12px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Unlock Admin Panel (already signed in)
        </button>
      )}
      {adminPanel && (
        <button
          type="button"
          className="auth-link-btn"
          onClick={() => {
            setAdminPanel(false);
            setAdminEmail("");
            setAdminPassword("");
          }}
          style={{
            marginTop: 8,
            width: "100%",
            background: "transparent",
            border: "none",
            color: "var(--m3)",
            fontSize: 10,
            cursor: "pointer",
          }}
        >
          Hide admin panel
        </button>
      )}
      <button
        type="button"
        className="auth-link-btn"
        disabled={resetLoading || adminPanel}
        onClick={resetPassword}
        style={{ marginTop: 10, width: "100%", background: "transparent", border: "none", color: "var(--m3)", fontSize: 10, cursor: "pointer" }}
      >
        {resetLoading ? "Sending..." : "Forgot password?"}
      </button>
    </form>
  );
}
