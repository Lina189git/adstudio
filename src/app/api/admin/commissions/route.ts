import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const commissions = await prisma.commissionRequest.findMany({
    include: {
      assignedArtist: { select: { id: true, name: true, email: true, image: true } },
      workUpdates:    { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const artists = await prisma.user.findMany({
    where:   { role: "ARTIST" },
    select:  { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ commissions, artists });
}
