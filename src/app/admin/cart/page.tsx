import AdminCartManager from "@/components/admin/AdminCartManager";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminCartPage() {
  return (
    <AdminShell
      eyebrow="Cart"
      title="Shopping Cart Management"
      description="View all active user carts, see what customers have pending, and remove individual items if needed."
    >
      <AdminCartManager />
    </AdminShell>
  );
}
