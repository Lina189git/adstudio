import { requireInfluencerPageSession } from "@/lib/influencer";
import ProfileSetup from "@/components/influencer/ProfileSetup";

export const dynamic = "force-dynamic";

export default async function InfluencerProfilePage() {
  await requireInfluencerPageSession();
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1614]">My Profile</h1>
        <p className="mt-2 text-[#6b5d54]">Set up your social links, niche, and sample shipping address.</p>
      </div>
      <ProfileSetup />
    </div>
  );
}
