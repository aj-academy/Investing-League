import { SettingsForm } from "@/components/settings/SettingsForm";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { DEMO_USER } from "@/lib/auth/demo";
import { getAuthContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  let profile: Record<string, unknown> | null = auth.profile as Record<string, unknown> | null;
  let settings: Record<string, unknown> | null = null;

  if (auth.isDemo) {
    profile = {
      full_name: DEMO_USER.full_name,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
      plan: DEMO_USER.plan,
      risk_disclaimer_accepted: true,
    };
    settings = {
      default_mode: "practice",
      default_timeframe: "5min",
      default_min_score: 5,
      show_b_signals: true,
    };
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    settings = data;
  }

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <Topbar />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <SettingsForm profile={profile} settings={settings} isDemo={auth.isDemo} />
      </div>
    </ProtectedShell>
  );
}
