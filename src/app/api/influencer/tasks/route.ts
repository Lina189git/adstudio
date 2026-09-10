import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";

// GET /api/influencer/tasks — list my ad tasks
export async function GET() {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const tasks = await prisma.adTask.findMany({
    where: { influencerId },
    orderBy: { createdAt: "desc" },
    include: {
      application: {
        include: {
          product: { select: { id: true, name: true, slug: true, imageUrl: true, commissionType: true, commissionRate: true, commissionFixed: true } },
          sample: { select: { status: true, trackingNumber: true, carrier: true, deliveredAt: true } },
        },
      },
      videos: { select: { id: true, title: true, status: true, createdAt: true } },
      payment: { select: { status: true, amountCents: true } },
    },
  });

  return NextResponse.json({ tasks });
}
