import { SettingsForm } from "@/components/settings/SettingsForm";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { data: capitalProfile } = await supabase
    .from("profiles")
    .select(
      "starting_capital, current_capital, risk_per_trade_percent, daily_profit_target_percent, weekly_profit_target_amount, weekly_target_from, weekly_target_to, daily_loss_limit_percent, max_consecutive_losses",
    )
    .eq("id", auth.user.id)
    .maybeSingle();

  return (
    <ProtectedShell isAdmin={auth.isAdmin} hasAdminRole={auth.hasAdminRole}>
      <Topbar />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <SettingsForm
          profile={auth.profile}
          settings={settings}
          email={auth.user.email || auth.profile?.email || ""}
          capitalProfile={capitalProfile}
        />
      </div>
    </ProtectedShell>
  );
}
