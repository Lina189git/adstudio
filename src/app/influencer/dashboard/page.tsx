import { requireInfluencerPageSession } from "@/lib/influencer";
import InfluencerDashboard from "@/components/influencer/InfluencerDashboard";

export const dynamic = "force-dynamic";

export default async function InfluencerDashboardPage() {
  await requireInfluencerPageSession();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1614]">My Dashboard</h1>
        <p className="mt-2 text-[#6b5d54]">Track your active tasks, applications, and earnings.</p>
      </div>
      <InfluencerDashboard />
    </div>
  );
}
