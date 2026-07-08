import type { JournalRow } from "@/components/journal/JournalTable";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JournalClient = Awaited<ReturnType<typeof createClient>>;

const MISSING_COLUMN_RE = /Could not find the '([^']+)' column of 'trade_journal' in the schema cache/i;

async function tryFetch(
  client: JournalClient,
  userId: string,
  column: "id" | "signal_uid",
  value: string,
) {
  const { data, error } = await client
    .from("trade_journal")
    .select("*")
    .eq(column, value)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as JournalRow;
}

/** Load one journal row owned by the user (service role when available). */
export async function fetchJournalRowForUser(
  userId: string,
  journalId: string,
  signalUid?: string | null,
): Promise<JournalRow | null> {
  const client = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();

  if (UUID_RE.test(journalId)) {
    const byId = await tryFetch(client, userId, "id", journalId);
    if (byId) return byId;
  }
  if (signalUid) {
    const byUid = await tryFetch(client, userId, "signal_uid", signalUid);
    if (byUid) return byUid;
  }
  if (!UUID_RE.test(journalId)) {
    const byUid = await tryFetch(client, userId, "signal_uid", journalId);
    if (byUid) return byUid;
  }
  return null;
}

/** Persist journal row updates for the authenticated owner. */
export async function saveJournalRowForUser(
  userId: string,
  rowId: string,
  patch: Record<string, unknown>,
) {
  const writer = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : await createClient();

  // Some deployments may lag optional migrations; retry without missing columns.
  const mutablePatch: Record<string, unknown> = { ...patch };

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: updated, error } = await writer
      .from("trade_journal")
      .update(mutablePatch)
      .eq("id", rowId)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    if (!error) {
      if (!updated) return { row: null, error: "Journal record not found" as const };
      return { row: updated as JournalRow, error: null };
    }

    const msg = error.message ?? "";
    const missing = msg.match(MISSING_COLUMN_RE)?.[1];
    if (!missing || !(missing in mutablePatch)) {
      return { row: null, error: msg };
    }
    delete mutablePatch[missing];
  }

  return { row: null, error: "Update failed after retrying missing columns" };
}
