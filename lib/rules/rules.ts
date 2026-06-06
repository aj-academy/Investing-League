import { createAdminClient } from "@/lib/supabase/admin";

export type ActiveRules = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  created_at: string;
} | null;

export async function getActiveRules(): Promise<ActiveRules> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("rules_documents")
    .select("id,title,content,updated_at,created_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ActiveRules) || null;
}

export async function getUserRulesAcknowledgement(
  userId: string,
  rulesId: string
): Promise<{ acknowledged: boolean; acknowledged_at?: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { acknowledged: false };
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_rules_acknowledgement")
    .select("acknowledged_at")
    .eq("user_id", userId)
    .eq("rules_id", rulesId)
    .maybeSingle();
  if (!data) return { acknowledged: false };
  return { acknowledged: true, acknowledged_at: data.acknowledged_at };
}

export async function userNeedsRulesAcknowledgement(userId: string): Promise<{
  required: boolean;
  active: ActiveRules;
}> {
  const active = await getActiveRules();
  if (!active) return { required: false, active: null };

  const ack = await getUserRulesAcknowledgement(userId, active.id);
  if (!ack.acknowledged || !ack.acknowledged_at) {
    return { required: true, active };
  }

  const ackTime = new Date(ack.acknowledged_at).getTime();
  const rulesTime = new Date(active.updated_at).getTime();
  return { required: ackTime < rulesTime, active };
}
