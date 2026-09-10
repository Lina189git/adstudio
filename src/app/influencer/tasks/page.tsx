import { requireInfluencerPageSession } from "@/lib/influencer";
import InfluencerTasksList from "@/components/influencer/InfluencerTasksList";

export const dynamic = "force-dynamic";

export default async function InfluencerTasksPage() {
  await requireInfluencerPageSession();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1614]">My Tasks</h1>
        <p className="mt-2 text-[#6b5d54]">Active ad tasks, sample tracking, and video submissions.</p>
      </div>
      <InfluencerTasksList />
    </div>
  );
}
