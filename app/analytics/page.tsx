import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { buildAnalyticsSummary } from "@/lib/analytics/summary";
import { getAuthContext } from "@/lib/auth/session";
import { getUserScanMetrics } from "@/lib/billing/scanMetrics";
import { getUserPlan } from "@/lib/billing/planLimits";
import { canScanToday } from "@/lib/billing/scanUsage";
import { loadJournalForUser } from "@/lib/journal/loadJournal";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const plan = getUserPlan(auth.profile);
  const [rows, scanMetrics, scanQuota] = await Promise.all([
    loadJournalForUser(auth.user.id, { limit: 500 }),
    getUserScanMetrics(auth.user.id),
    canScanToday(auth.user.id, plan),
  ]);

  const summary = buildAnalyticsSummary(
    rows as Parameters<typeof buildAnalyticsSummary>[0],
  );

  return (
    <ProtectedShell isAdmin={auth.isAdmin} hasAdminRole={auth.hasAdminRole}>
      <Topbar scansToday={scanMetrics.scansToday} />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <AnalyticsView
          summary={summary}
          rows={rows}
          scanUsage={{
            scansToday: scanMetrics.scansToday,
            totalScans: scanMetrics.totalScans,
            dailyScanLimit: scanQuota.dailyScanLimit,
            scansRemainingToday: scanQuota.scansRemainingToday,
          }}
        />
      </div>
    </ProtectedShell>
  );
}
