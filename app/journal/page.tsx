import { ExportButtons } from "@/components/journal/ExportButtons";
import { JournalClient } from "@/components/journal/JournalClient";
import { RiskDisclaimerBanner } from "@/components/dashboard/RiskDisclaimerBanner";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthContext } from "@/lib/auth/session";
import { getDemoJournal } from "@/lib/demo/mockStore";
import { redirect } from "next/navigation";

export default async function JournalPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  let rows = getDemoJournal();

  if (!auth.isDemo) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("trade_journal")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    rows = (data || []) as typeof rows;
  }

  return (
    <ProtectedShell isAdmin={auth.isAdmin}>
      <Topbar />
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
