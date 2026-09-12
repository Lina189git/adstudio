import { NextRequest, NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/tasks
export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 20;

  const where = status ? { status: status as TaskStatus } : {};

  const [tasks, total] = await Promise.all([
    prisma.adTask.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        influencer: {
          select: {
            id: true, name: true, email: true, image: true,
            influencerProfile: { select: { shippingAddress: true, instagram: true, tiktok: true, youtube: true } },
          },
        },
        application: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
            sample: true,
          },
        },
        videos: { select: { id: true, title: true, status: true, createdAt: true } },
        payment: true,
      },
    }),
    prisma.adTask.count({ where }),
  ]);

  return NextResponse.json({ tasks, pagination: { page, pages: Math.ceil(total / limit), total } });
}
