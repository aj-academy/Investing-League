import { createAdminClient } from "@/lib/supabase/admin";

/** Server-only: read profile fields after the user is authenticated. */
export async function getProfileByUserId(userId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("full_name, email, role, plan, risk_disclaimer_accepted")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function hasAcceptedRiskDisclaimer(userId: string) {
  const profile = await getProfileByUserId(userId);
  return Boolean(profile?.risk_disclaimer_accepted);
}
