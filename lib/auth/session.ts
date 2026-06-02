import { getProfileByUserId } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export type AuthContext = {
  user: { id: string; email: string };
  isAdmin: boolean;
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

export async function getAuthContext(): Promise<AuthContext | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile =
    (await getProfileByUserId(user.id)) ??
    (
      await supabase
        .from("profiles")
        .select("full_name, email, role, plan, is_active, risk_disclaimer_accepted")
        .eq("id", user.id)
        .maybeSingle()
    ).data;

  return {
    user: { id: user.id, email: user.email ?? "" },
    isAdmin: profile?.role === "admin",
    isActive: profile?.is_active !== false,
    profile: profile ?? null,
  };
}
