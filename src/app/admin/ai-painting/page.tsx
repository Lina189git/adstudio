import AdminAIPaintingManager from "@/components/admin/AdminAIPaintingManager";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminAIPaintingPage() {
  return (
    <AdminShell
      eyebrow="AI Studio"
      title="AI Painting Studio Management"
      description="Monitor OpenAI conversion activity, review the end-to-end workflow, and manage the frame catalogue available to customers."
    >
      <AdminAIPaintingManager />
    </AdminShell>
  );
}
