import { hasAdminSessionCookie } from "@/lib/auth/adminSession";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { AppShell } from "./AppShell";

export async function ProtectedShell({
  children,
  isAdmin: isAdminProp,
  hasAdminRole: hasAdminRoleProp,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  hasAdminRole?: boolean;
}) {
  let isAdmin = isAdminProp ?? false;
  let hasAdminRole = hasAdminRoleProp ?? false;

  if (isAdminProp === undefined || hasAdminRoleProp === undefined) {
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
      const cookieStore = await cookies();
      const adminRole = profile?.role === "admin";
      hasAdminRole = hasAdminRoleProp ?? adminRole;
      isAdmin = isAdminProp ?? (adminRole && hasAdminSessionCookie(cookieStore));
    }
  }

  return (
    <AppShell isAdmin={isAdmin} hasAdminRole={hasAdminRole}>
      {children}
    </AppShell>
  );
}
