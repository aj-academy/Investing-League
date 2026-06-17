import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActiveTerms = {
  id: string;
  title: string;
  version: string;
  content: string | null;
  file_url: string | null;
  requires_reacceptance: boolean;
  created_at: string;
} | null;

export function hasValidServiceRoleKey(): boolean {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(service && service.length > 20 && service !== anon);
}

export async function getActiveTerms(): Promise<ActiveTerms> {
  const select =
    "id,title,version,content,file_url,requires_reacceptance,created_at";

  if (hasValidServiceRoleKey()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("terms_documents")
      .select(select)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data as ActiveTerms;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("terms_documents")
    .select(select)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ActiveTerms) || null;
}

export async function getUserAcceptedTerms(
  userId: string,
  termsId: string,
): Promise<{ accepted: boolean; accepted_at?: string }> {
  const supabase = await createClient();
  const { data } = await supabase
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
