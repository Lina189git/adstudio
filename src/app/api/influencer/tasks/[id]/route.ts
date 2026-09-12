import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";

export const dynamic = "force-dynamic";

// GET /api/influencer/tasks/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const task = await prisma.adTask.findFirst({
    where: { id: params.id, influencerId },
    include: {
      application: {
        include: {
          product: { select: { name: true, imageUrl: true, description: true, taskRequirements: true, basePriceCents: true, commissionType: true, commissionRate: true, commissionFixed: true } },
          sample: true,
        },
      },
      videos: { orderBy: { createdAt: "desc" } },
      payment: true,
    },
  });

  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json(task);
}
