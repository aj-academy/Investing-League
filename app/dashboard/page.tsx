import { DashboardClient, type ScanSettings } from "@/components/dashboard/DashboardClient";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { getAuthContext } from "@/lib/auth/session";
import { getProfileByUserId } from "@/lib/auth/profile";
import { canScanToday } from "@/lib/billing/scanUsage";
import { getUserPlan, normalizeAutoRefresh } from "@/lib/billing/planLimits";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const profile = await getProfileByUserId(auth.user.id);
  const plan = getUserPlan(profile);
  const scanQuota = await canScanToday(auth.user.id, plan);

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const initialSettings: ScanSettings = {
    asset: "all",
    timeframe: settings?.default_timeframe || "5min",
    minScore: settings?.default_min_score || 5,
    showB: settings?.show_b_signals ?? true,
    session: "any",
    autoRefresh: normalizeAutoRefresh(
      settings?.auto_refresh_seconds != null
        ? Number(settings.auto_refresh_seconds)
        : "off",
      plan
    ),
    mode: (settings?.default_mode as "practice" | "live") || "practice",
  };

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <DashboardClient
        initialSettings={initialSettings}
        planInfo={{
          plan,
          scansUsedToday: scanQuota.scansUsedToday,
          scansRemainingToday: scanQuota.scansRemainingToday,
          dailyScanLimit: scanQuota.dailyScanLimit,
        }}
      />
    </ProtectedShell>
  );
}
