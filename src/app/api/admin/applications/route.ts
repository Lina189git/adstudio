import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

// GET /api/admin/applications
export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 20;

  const where = status ? { status: status as ApplicationStatus } : {};

  const [applications, total] = await Promise.all([
    prisma.adApplication.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, commissionType: true, commissionRate: true, commissionFixed: true, sampleStock: true, basePriceCents: true, taskRequirements: true } },
        influencer: {
          select: {
            id: true, name: true, email: true, image: true,
            influencerProfile: { select: { shippingAddress: true, instagram: true, tiktok: true, youtube: true, followerCount: true } },
          },
        },
        sample: true,
        task: { select: { id: true, ref: true, status: true } },
      },
    }),
    prisma.adApplication.count({ where }),
  ]);

  return NextResponse.json({ applications, pagination: { page, pages: Math.ceil(total / limit), total } });
}
