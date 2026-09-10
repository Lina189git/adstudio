import { NextRequest, NextResponse } from "next/server";
import { requireArtistApiSession, unauthorizedArtistResponse } from "@/lib/artist";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireArtistApiSession();
  if (!session) return unauthorizedArtistResponse();

  const artistId = (session.user as { id: string }).id;
  const isAdmin  = session.user?.role === "ADMIN";

  const commission = await prisma.commissionRequest.findUnique({
    where: { id: params.id },
    select: { assignedArtistId: true },
  });

  if (!commission) {
    return NextResponse.json({ error: "Commission not found." }, { status: 404 });
  }

  if (!isAdmin && commission.assignedArtistId !== artistId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const updates = await prisma.workUpdate.findMany({
    where: { commissionId: params.id },
    include: { artist: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ updates });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireArtistApiSession();
  if (!session) return unauthorizedArtistResponse();

  const artistId = (session.user as { id: string }).id;
  const isAdmin  = session.user?.role === "ADMIN";

  const commission = await prisma.commissionRequest.findUnique({
    where: { id: params.id },
    select: { assignedArtistId: true, status: true },
  });

  if (!commission) {
    return NextResponse.json({ error: "Commission not found." }, { status: 404 });
  }

  if (!isAdmin && commission.assignedArtistId !== artistId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, imageUrls, videoUrls, step, isVisibleToCustomer } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Update title is required." }, { status: 400 });
  }

  if (!step?.trim()) {
    return NextResponse.json({ error: "Painting step is required." }, { status: 400 });
  }

  const update = await prisma.workUpdate.create({
    data: {
      commissionId:        params.id,
      artistId,
      title:               String(title).trim(),
      description:         description ? String(description).trim() : null,
      imageUrls:           Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [],
      videoUrls:           Array.isArray(videoUrls) ? videoUrls.filter(Boolean) : [],
      step:                String(step).trim(),
      isVisibleToCustomer: isVisibleToCustomer !== false,
    },
    include: { artist: { select: { id: true, name: true, image: true } } },
  });

  // Auto-set commission to IN_PROGRESS when first update is posted
  if (commission.status === "ASSIGNED") {
    await prisma.commissionRequest.update({
      where: { id: params.id },
      data:  { status: "IN_PROGRESS" },
    });
  }

  return NextResponse.json({ update }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireArtistApiSession();
  if (!session) return unauthorizedArtistResponse();

  const artistId = (session.user as { id: string }).id;
  const body     = await request.json();
  const updateId = String(body.updateId ?? "");

  if (!updateId) {
    return NextResponse.json({ error: "updateId is required." }, { status: 400 });
  }

  const workUpdate = await prisma.workUpdate.findUnique({
    where: { id: updateId },
    select: { artistId: true, commissionId: true },
  });

  if (!workUpdate || workUpdate.commissionId !== params.id) {
    return NextResponse.json({ error: "Update not found." }, { status: 404 });
  }

  if (workUpdate.artistId !== artistId && session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.workUpdate.delete({ where: { id: updateId } });

  return NextResponse.json({ ok: true });
}
