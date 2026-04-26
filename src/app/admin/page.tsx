import AdminDashboard from "@/components/AdminDashboard";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminPage() {
  return (
    <AdminShell
      eyebrow="Operations"
      title="Admin Command Center"
      description="Run product, order, and user operations from a single control surface built for day-to-day storefront management."
    >
      <AdminDashboard />
    </AdminShell>
  );
}
