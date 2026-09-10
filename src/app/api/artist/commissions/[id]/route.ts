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

  if (!isAdmin && commission.assignedArtistId !== artistId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ commission });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireArtistApiSession();
  if (!session) return unauthorizedArtistResponse();

  const artistId    = (session.user as { id: string }).id;
  const artistName  = session.user?.name ?? "Artist";
  const isAdmin     = session.user?.role === "ADMIN";

  const commission = await prisma.commissionRequest.findUnique({
    where: { id: params.id },
  });

  if (!commission) {
    return NextResponse.json({ error: "Commission not found." }, { status: 404 });
  }

  if (!isAdmin && commission.assignedArtistId !== artistId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body   = await request.json();
  const action = body.action as string | undefined;

  // ── Accept commission ──────────────────────────────────────────────────────
  if (action === "accept") {
    if (commission.status !== "ASSIGNED") {
      return NextResponse.json(
        { error: "Only ASSIGNED commissions can be accepted." },
        { status: 400 }
      );
    }
    const updated = await prisma.commissionRequest.update({
      where: { id: params.id },
      data:  { status: "IN_PROGRESS" },
    });
    return NextResponse.json({ commission: updated });
  }

  // ── Decline commission ─────────────────────────────────────────────────────
  if (action === "decline") {
    if (commission.status !== "ASSIGNED") {
      return NextResponse.json(
        { error: "Only ASSIGNED commissions can be declined." },
        { status: 400 }
      );
    }
    const reason = String(body.reason ?? "").trim() || "No reason provided";
    const note   = `Declined by ${artistName} on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}: ${reason}`;
    const existing = commission.adminNotes ?? "";

    await prisma.commissionRequest.update({
      where: { id: params.id },
      data: {
        status:           "APPROVED",     // back in the assignable pool
        assignedArtistId: null,
        adminNotes:       existing ? `${existing}\n\n${note}` : note,
      },
    });
    return NextResponse.json({ ok: true, message: "Commission returned to queue." });
  }

  // ── Generic status update (IN_PROGRESS → REVIEW, etc.) ────────────────────
  const allowedArtistStatuses = ["IN_PROGRESS", "REVIEW"];
  const newStatus = String(body.status ?? "");

  if (!isAdmin && newStatus && !allowedArtistStatuses.includes(newStatus)) {
    return NextResponse.json(
      { error: "Artists may only set status to IN_PROGRESS or REVIEW." },
      { status: 400 }
    );
  }

  const updated = await prisma.commissionRequest.update({
    where: { id: params.id },
    data:  { ...(newStatus ? { status: newStatus as any } : {}) },
  });

  return NextResponse.json({ commission: updated });
}
