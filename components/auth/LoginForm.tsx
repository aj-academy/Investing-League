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
  const [adminPanel, setAdminPanel] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          await supabase.auth.signOut();
          toast.error("Admin login failed. Try again.");
          return;
        }

        const verifyRes = await fetch("/api/auth/admin-verify", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const verifyJson = (await verifyRes.json()) as { ok?: boolean; error?: string };

        if (!verifyRes.ok || !verifyJson.ok) {
          await supabase.auth.signOut();
          toast.error(verifyJson.error || "Admin access denied.");
          return;
        }

        window.location.assign("/admin");
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
