import { requireAdminPageSession } from "@/lib/admin";
import AdminShell from "@/components/admin/AdminShell";
import AdminVideosManager from "@/components/admin/AdminVideosManager";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  await requireAdminPageSession();
  return (
    <AdminShell eyebrow="Influencer platform" title="Video Review" description="Approve and publish influencer ad videos, and issue commission payments.">
      <AdminVideosManager />
    </AdminShell>
  );
}
