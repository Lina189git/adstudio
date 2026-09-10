import { requireInfluencerPageSession } from "@/lib/influencer";
import TaskDetail from "@/components/influencer/TaskDetail";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InfluencerTaskPage({ params }: { params: { id: string } }) {
  await requireInfluencerPageSession();
  return (
    <div>
      <Link href="/influencer/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#6b5d54] hover:text-[#1a1614]">
        <ArrowLeft className="h-4 w-4" />Back to dashboard
      </Link>
      <h1 className="mb-6 text-3xl font-bold text-[#1a1614]">Task detail</h1>
      <TaskDetail taskId={params.id} />
    </div>
  );
}
