import { AdminView } from "@/components/admin/AdminView";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Topbar } from "@/components/layout/Topbar";

export default function AdminPage() {
  return (
    <ProtectedShell>
      <Topbar />
      <div className="wrap z">
        <AdminView />
      </div>
    </ProtectedShell>
  );
}
