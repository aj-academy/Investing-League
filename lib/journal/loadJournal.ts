import type { JournalRow } from "@/components/journal/JournalTable";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Load journal rows for the authenticated user (service role when available). */
export async function loadJournalForUser(userId: string): Promise<JournalRow[]> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("trade_journal")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) return data as JournalRow[];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("trade_journal")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (data || []) as JournalRow[];
}
