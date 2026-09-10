import { requireAdminPageSession } from "@/lib/admin";
import AdminShell from "@/components/admin/AdminShell";
import AdminTasksManager from "@/components/admin/AdminTasksManager";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  await requireAdminPageSession();
  return (
    <AdminShell eyebrow="Influencer platform" title="Ad Tasks" description="Issue task briefs, track sample shipments, and monitor influencer submissions.">
      <AdminTasksManager />
    </AdminShell>
  );
}
