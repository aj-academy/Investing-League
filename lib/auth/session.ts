import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  DEMO_COOKIE,
  DEMO_USER,
  isDemoSessionValue,
  isDemoCredentials,
} from "./demo";

export type AuthContext = {
  user: { id: string; email: string };
  isDemo: boolean;
  isAdmin: boolean;
  profile: {
    full_name: string | null;
    email: string | null;
    role: string;
    plan: string;
    risk_disclaimer_accepted: boolean;
  } | null;
};

export async function getDemoSessionFromCookies(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  if (!isDemoSessionValue(cookieStore.get(DEMO_COOKIE)?.value)) return null;
  return {
    user: { id: DEMO_USER.id, email: DEMO_USER.email },
    isDemo: true,
    isAdmin: true,
    profile: {
      full_name: DEMO_USER.full_name,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
      plan: DEMO_USER.plan,
      risk_disclaimer_accepted: DEMO_USER.risk_disclaimer_accepted,
    },
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const demo = await getDemoSessionFromCookies();
  if (demo) return demo;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, plan, risk_disclaimer_accepted")
    .eq("id", user.id)
    .single();

  return {
    user: { id: user.id, email: user.email ?? "" },
    isDemo: false,
    isAdmin: profile?.role === "admin",
    profile: profile ?? null,
  };
}

export { isDemoCredentials };
