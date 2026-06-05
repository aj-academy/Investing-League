import { hasAdminSessionCookie } from "@/lib/auth/adminSession";
import { getProfileByUserId } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { cache } from "react";

export type AuthContext = {
  user: { id: string; email: string };
  /** Admin role in DB + explicit admin-panel session cookie. */
  isAdmin: boolean;
  /** Admin role in DB (may still need open-admin sign-in for panel access). */
  hasAdminRole: boolean;
  isActive: boolean;
  profile: {
    full_name: string | null;
    email: string | null;
    role: string;
    plan: string;
    is_active: boolean;
    risk_disclaimer_accepted: boolean;
  } | null;
};

export const getAuthContext = cache(async function getAuthContext(): Promise<AuthContext | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sessionProfile } = await supabase
    .from("profiles")
    .select("full_name, email, role, plan, is_active, risk_disclaimer_accepted")
    .eq("id", user.id)
    .maybeSingle();

  const profile = sessionProfile ?? (await getProfileByUserId(user.id));

  const cookieStore = await cookies();
  const adminSession = hasAdminSessionCookie(cookieStore);
  const hasAdminRole = profile?.role === "admin" && profile?.is_active !== false;

  return {
    user: { id: user.id, email: user.email ?? "" },
    hasAdminRole,
    isAdmin: hasAdminRole && adminSession,
    isActive: profile?.is_active !== false,
    profile: profile ?? null,
  };
});
