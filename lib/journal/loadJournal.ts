import type { JournalRow } from "@/components/journal/JournalTable";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type LoadJournalOptions = {
  pair?: string;
  result?: string;
  limit?: number;
};

function applyJournalFilters<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  options?: LoadJournalOptions,
) {
  let next = query;
  if (options?.pair) next = next.eq("pair", options.pair);
  if (options?.result) next = next.eq("result", options.result);
  return next;
}

/** Load journal rows for the authenticated user (service role when available). */
export const loadJournalForUser = cache(async function loadJournalForUser(
  userId: string,
  options?: LoadJournalOptions,
): Promise<JournalRow[]> {
  const limit = options?.limit ?? 200;

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminClient();
    let query = admin
      .from("trade_journal")
      .select("*")
      .eq("user_id", userId);
    query = applyJournalFilters(query, options);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) return data as JournalRow[];
  }

  const supabase = await createClient();
  let query = supabase.from("trade_journal").select("*").eq("user_id", userId);
  query = applyJournalFilters(query, options);
  const { data } = await query.order("created_at", { ascending: false }).limit(limit);

  return (data || []) as JournalRow[];
});
