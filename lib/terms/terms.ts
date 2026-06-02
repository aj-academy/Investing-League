import { createAdminClient } from "@/lib/supabase/admin";

export type ActiveTerms = {
  id: string;
  title: string;
  version: string;
  content: string | null;
  file_url: string | null;
  requires_reacceptance: boolean;
  created_at: string;
} | null;

export async function getActiveTerms(): Promise<ActiveTerms> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("terms_documents")
    .select("id,title,version,content,file_url,requires_reacceptance,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ActiveTerms) || null;
}

export async function getUserAcceptedTerms(
  userId: string,
  termsId: string
): Promise<{ accepted: boolean; accepted_at?: string }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { accepted: false };
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_terms_acceptance")
    .select("accepted_at")
    .eq("user_id", userId)
    .eq("terms_id", termsId)
    .maybeSingle();
  if (!data) return { accepted: false };
  return { accepted: true, accepted_at: data.accepted_at };
}

export async function hasAcceptedLatestTerms(userId: string): Promise<boolean> {
  const active = await getActiveTerms();
  if (!active) return true;
  const accepted = await getUserAcceptedTerms(userId, active.id);
  return accepted.accepted;
}
