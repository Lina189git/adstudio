import { requireAdminPageSession } from "@/lib/admin";
import AdminShell from "@/components/admin/AdminShell";
import AdminApplicationsManager from "@/components/admin/AdminApplicationsManager";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await requireAdminPageSession();
  return (
    <AdminShell eyebrow="Influencer platform" title="Applications" description="Review influencer applications to promote your products.">
      <AdminApplicationsManager />
    </AdminShell>
  );
}
