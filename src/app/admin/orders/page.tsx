import AdminOrdersManager from "@/components/admin/AdminOrdersManager";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminOrdersPage() {
  return (
    <AdminShell
      eyebrow="Fulfillment"
      title="Order Management"
      description="Track payment state, production progress, and shipping execution across the order pipeline."
    >
      <AdminOrdersManager />
    </AdminShell>
  );
}
