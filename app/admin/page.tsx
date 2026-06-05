import { AdminView } from "@/components/admin/AdminView";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";
import { getAuthContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!auth.isActive) redirect("/account-suspended");
  if (!auth.isAdmin) redirect("/dashboard");

  return (
    <ProtectedShell isAdmin hasAdminRole>
      <Topbar />
      <div className="wrap z">
        <AdminView />
      </div>
    </ProtectedShell>
  );
}
