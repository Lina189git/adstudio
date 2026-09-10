import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/influencer/profile — get current influencer's profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const profile = await prisma.influencerProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

// PUT /api/influencer/profile — create or update influencer profile
export async function PUT(request: NextRequest) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const { bio, website, instagram, youtube, tiktok, twitter, followerCount, niche, country, city, shippingAddress } = body;

  const profile = await prisma.influencerProfile.upsert({
    where: { userId },
    create: {
      userId,
      bio: bio?.trim() || null,
      website: website?.trim() || null,
      instagram: instagram?.trim() || null,
      youtube: youtube?.trim() || null,
      tiktok: tiktok?.trim() || null,
      twitter: twitter?.trim() || null,
      followerCount: followerCount ? Number(followerCount) : null,
      niche: Array.isArray(niche) ? niche : [],
      country: country?.trim() || null,
      city: city?.trim() || null,
      shippingAddress: shippingAddress || null,
    },
    update: {
      bio: bio?.trim() || null,
      website: website?.trim() || null,
      instagram: instagram?.trim() || null,
      youtube: youtube?.trim() || null,
      tiktok: tiktok?.trim() || null,
      twitter: twitter?.trim() || null,
      followerCount: followerCount ? Number(followerCount) : null,
      niche: Array.isArray(niche) ? niche : [],
      country: country?.trim() || null,
      city: city?.trim() || null,
      shippingAddress: shippingAddress || null,
    },
  });

  return NextResponse.json(profile);
}
