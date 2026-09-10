import { NextResponse } from "next/server";
import { requireArtistApiSession, unauthorizedArtistResponse } from "@/lib/artist";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireArtistApiSession();
  if (!session) return unauthorizedArtistResponse();

  const artistId = (session.user as { id: string }).id;
  const isAdmin  = session.user?.role === "ADMIN";

  const commissions = await prisma.commissionRequest.findMany({
    where: isAdmin ? {} : { assignedArtistId: artistId },
    include: {
      assignedArtist: { select: { id: true, name: true, email: true, image: true } },
      workUpdates:    { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ commissions });
}
