import { NextRequest, NextResponse } from "next/server";
import { VideoStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/videos
export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 20;

  const where = status ? { status: status as VideoStatus } : {};

  const [videos, total] = await Promise.all([
    prisma.videoSubmission.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        influencer: { select: { id: true, name: true, email: true, image: true } },
        task: {
          include: {
            application: {
              select: {
                agreedRate: true, agreedAmount: true,
                product: { select: { id: true, name: true, imageUrl: true, basePriceCents: true } },
              },
            },
            payment: { select: { id: true, status: true, amountCents: true, paymentRef: true } },
          },
        },
      },
    }),
    prisma.videoSubmission.count({ where }),
  ]);

  return NextResponse.json({ videos, pagination: { page, pages: Math.ceil(total / limit), total } });
}
