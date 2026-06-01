import { SettingsForm } from "@/components/settings/SettingsForm";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthContext } from "@/lib/auth/session";
import { getProfileByUserId } from "@/lib/auth/profile";
import { getUserPlan } from "@/lib/billing/planLimits";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const profileRow = await getProfileByUserId(auth.user.id);
  const plan = getUserPlan(profileRow);

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <Topbar />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <SettingsForm
          profile={auth.profile}
          settings={settings}
          email={auth.user.email || auth.profile?.email || ""}
          plan={plan}
        />
      </div>
    </ProtectedShell>
  );
}
