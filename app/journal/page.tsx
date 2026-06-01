import { ExportButtons } from "@/components/journal/ExportButtons";
import { JournalClient } from "@/components/journal/JournalClient";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthContext } from "@/lib/auth/session";
import { canScanToday } from "@/lib/billing/scanUsage";
import { getProfileByUserId } from "@/lib/auth/profile";
import { getUserPlan } from "@/lib/billing/planLimits";
import { loadJournalForUser } from "@/lib/journal/loadJournal";
import { redirect } from "next/navigation";

export default async function JournalPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const rows = await loadJournalForUser(auth.user.id);
  const profile = await getProfileByUserId(auth.user.id);
  const plan = getUserPlan(profile);
  const scanQuota = await canScanToday(auth.user.id, plan);

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <Topbar scansToday={scanQuota.scansUsedToday} />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <div className="journal-box">
          <div className="journal-head">
            <div>
              <div className="journal-title">THE INVESTING LEAGUE TRADE JOURNAL</div>
              <div style={{ fontSize: 10, color: "var(--m3)", marginTop: 3 }}>
                Mark signals, enter Olymp opening/closing quotes, and export for performance review.
              </div>
            </div>
            <ExportButtons />
          </div>
          <JournalClient initialRows={rows} />
        </div>
      </div>
    </ProtectedShell>
  );
}
