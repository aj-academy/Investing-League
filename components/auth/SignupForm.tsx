"use client";

import { createClient } from "@/lib/supabase/client";
import { DISCLAIMER } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      toast.error("Please accept the risk disclaimer to continue.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        full_name: name,
        risk_disclaimer_accepted: true,
        disclaimer_accepted_at: new Date().toISOString(),
      });
      await supabase.from("user_settings").upsert({ user_id: data.user.id });
    }
    setLoading(false);
    toast.success("Account created. You can sign in now.");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit}>
      <input
        type="text"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      <label style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--m3)", marginBottom: 12 }}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>{DISCLAIMER}</span>
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
