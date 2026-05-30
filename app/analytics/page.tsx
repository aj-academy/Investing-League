import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { buildAnalyticsSummary } from "@/lib/analytics/summary";
import { getAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const supabase = await createClient();
  const { data: rows } = await supabase.from("trade_journal").select("*").eq("user_id", auth.user.id);

  const summary = buildAnalyticsSummary(
    (rows || []) as Parameters<typeof buildAnalyticsSummary>[0]
  );

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <Topbar />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <AnalyticsView summary={summary} />
      </div>
    </ProtectedShell>
  );
}
