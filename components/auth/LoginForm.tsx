"use client";

import { isDemoCredentials } from "@/lib/auth/demo";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("sample@gmail.com");
  const [password, setPassword] = useState("12345678");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isDemoCredentials(email, password)) {
        const res = await fetch("/api/auth/demo/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Demo login failed");
          return;
        }
        toast.success("Demo mode — exploring with sample data");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        toast.error(
          "Supabase is not configured. Use demo login: sample@gmail.com / 12345678"
        );
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p
        style={{
          fontSize: 10,
          color: "var(--gold2)",
          marginBottom: 12,
          lineHeight: 1.6,
        }}
      >
        <strong>Demo access:</strong> sample@gmail.com / 12345678 — no Supabase required.
      </p>
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
    </form>
  );
}
