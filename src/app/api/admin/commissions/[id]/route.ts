import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const commission = await prisma.commissionRequest.findUnique({
    where: { id: params.id },
    include: {
      assignedArtist: { select: { id: true, name: true, email: true, image: true } },
      workUpdates: {
        include: { artist: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!commission) {
    return NextResponse.json({ error: "Commission not found." }, { status: 404 });
  }

  const artists = await prisma.user.findMany({
    where:   { role: "ARTIST" },
    select:  { id: true, name: true, email: true, image: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ commission, artists });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const body = await request.json();
  const { status, assignedArtistId, adminNotes } = body;

  const existing = await prisma.commissionRequest.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Commission not found." }, { status: 404 });
  }

  const updated = await prisma.commissionRequest.update({
    where: { id: params.id },
    data: {
      ...(status           ? { status: status as any }                 : {}),
      ...(assignedArtistId !== undefined ? { assignedArtistId }        : {}),
      ...(adminNotes       !== undefined ? { adminNotes }              : {}),
      ...(status === "COMPLETED" ? { completedAt: new Date() }        : {}),
      ...(status === "ASSIGNED" && assignedArtistId
        ? { status: "ASSIGNED" as any }
        : {}),
    },
    include: {
      assignedArtist: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({ commission: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  await prisma.commissionRequest.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
