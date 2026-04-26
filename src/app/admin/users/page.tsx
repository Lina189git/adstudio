import AdminUsersManager from "@/components/admin/AdminUsersManager";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminUsersPage() {
  return (
    <AdminShell
      eyebrow="Access"
      title="User Management"
      description="Review customer accounts, maintain admin access, and manage role assignments with audit-friendly controls."
    >
      <AdminUsersManager />
    </AdminShell>
  );
}
