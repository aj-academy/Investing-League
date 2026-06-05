import { DashboardClient, type ScanSettings } from "@/components/dashboard/DashboardClient";
import { resolveUserAllowedPairs } from "@/lib/access/assetAccess";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { getAuthContext } from "@/lib/auth/session";
import { canScanToday } from "@/lib/billing/scanUsage";
import { getUserPlan, normalizeAutoRefresh } from "@/lib/billing/planLimits";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const plan = getUserPlan(auth.profile);
  const supabase = await createClient();

  const [allowedPairs, scanQuota, { data: settings }] = await Promise.all([
    resolveUserAllowedPairs(auth.user.id, plan),
    canScanToday(auth.user.id, plan),
    supabase.from("user_settings").select("*").eq("user_id", auth.user.id).maybeSingle(),
  ]);

  const storedTf = settings?.default_timeframe || "5min";
  const initialSettings: ScanSettings = {
    timeframe: storedTf === "both" ? "both" : storedTf === "15min" ? "15min" : "5min",
    minGrade: settings?.show_b_signals === false ? "A" : "B",
    minScore: settings?.default_min_score || 5,
    dailyTradeLimit: 5,
    session: "any",
    autoRefresh: normalizeAutoRefresh(
      settings?.auto_refresh_seconds != null
        ? Number(settings.auto_refresh_seconds)
        : "off",
      plan,
    ),
    mode: (settings?.default_mode as "practice" | "live") || "practice",
  };

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <DashboardClient
        initialSettings={initialSettings}
        allowedPairs={allowedPairs}
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
