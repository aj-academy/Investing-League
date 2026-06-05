import { ExportButtons } from "@/components/journal/ExportButtons";
import { JournalClient } from "@/components/journal/JournalClient";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthContext } from "@/lib/auth/session";
import { loadJournalForUser } from "@/lib/journal/loadJournal";
import { redirect } from "next/navigation";

export default async function JournalPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  const rows = await loadJournalForUser(auth.user.id);

  return (
    <ProtectedShell isAdmin={auth.isAdmin} hasAdminRole={auth.hasAdminRole}>
      <Topbar />
      <div className="wrap z">
        <RiskDisclaimerBanner />
        <div className="journal-box">
          <div className="journal-head">
            <div>
              <div className="journal-title">THE INVESTING LEAGUE TRADE JOURNAL</div>
              <div style={{ fontSize: 10, color: "var(--m3)", marginTop: 3 }}>
                Mark every signal as Win / Loss, enter actual opening quote/time, and download the
                report for testing accuracy.
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
