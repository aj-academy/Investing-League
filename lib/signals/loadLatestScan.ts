import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ComputedSignal } from "@/lib/signal-engine/types";

export type LatestScanResult = {
  sessionId: string | null;
  signals: ComputedSignal[];
  pairs: string[];
};

function db() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return null;
}

/** Latest completed scan for user (ignores short session expiry). */
export async function loadLatestScanForUser(userId: string): Promise<LatestScanResult> {
  const admin = db();
  const supabase = admin ?? (await createClient());

  const { data: session } = await supabase
    .from("scan_sessions")
    .select("id, pairs, status, created_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    return { sessionId: null, signals: [], pairs: [] };
  }

  const { data: rows } = await supabase
    .from("signals")
    .select("raw_payload")
    .eq("user_id", userId)
    .eq("scan_session_id", session.id);

  let signals = (rows || [])
    .map((r) => r.raw_payload as ComputedSignal | null)
    .filter(Boolean) as ComputedSignal[];

  if (!signals.length) {
    const { data: fallback } = await supabase
      .from("signals")
      .select("raw_payload")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(24);
    signals = (fallback || [])
      .map((r) => r.raw_payload as ComputedSignal | null)
      .filter(Boolean) as ComputedSignal[];
  }

  return {
    sessionId: session.id,
    signals,
    pairs: (session.pairs as string[]) || [],
  };
}
