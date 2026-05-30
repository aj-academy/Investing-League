import { DashboardClient, type ScanSettings } from "@/components/dashboard/DashboardClient";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { getAuthContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  let initialSettings: ScanSettings = {
    asset: "all",
    timeframe: "5min",
    minScore: 5,
    showB: true,
    session: "any",
    autoRefresh: 60,
    mode: "practice",
  };

  let usageCount = 3;

  if (!auth.isDemo) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", auth.user.id);

    initialSettings = {
      asset: "all",
      timeframe: settings?.default_timeframe || "5min",
      minScore: settings?.default_min_score || 5,
      showB: settings?.show_b_signals ?? true,
      session: "any",
      autoRefresh: settings?.auto_refresh_seconds || 60,
      mode: (settings?.default_mode as "practice" | "live") || "practice",
    };
    usageCount = count || 0;
  }

  const connected = auth.isDemo || !!process.env.TWELVE_DATA_API_KEY;

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      {auth.isDemo && (
        <div
          className="disclaimer-banner z"
          style={{
            margin: "0 14px",
            borderColor: "rgba(0,170,255,.35)",
            color: "var(--blue2)",
          }}
        >
          <strong>DEMO MODE</strong> — Logged in as sample@gmail.com. Scans use synthetic market
          data. Journal and analytics use sample records until Supabase is connected.
        </div>
      )}
      <DashboardClient
        initialSettings={initialSettings}
        connected={connected}
        usageCount={usageCount}
        isDemo={auth.isDemo}
      />
    </ProtectedShell>
  );
}
