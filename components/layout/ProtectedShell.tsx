import { createClient } from "@/lib/supabase/server";
import { AppShell } from "./AppShell";

export async function ProtectedShell({
  children,
  isAdmin: isAdminProp,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  let isAdmin = isAdminProp ?? false;

  if (isAdminProp === undefined) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "admin";
    }
  }

  return <AppShell isAdmin={isAdmin}>{children}</AppShell>;
}
