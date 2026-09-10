import AdminDashboard from "@/components/AdminDashboard";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminPage() {
  return (
    <AdminShell
      eyebrow="Influencer platform"
      title="Admin Command Center"
      description="Manage products, review influencer applications, issue task briefs, and approve ad videos from one control surface."
    >
      <AdminDashboard />
    </AdminShell>
  );
}
