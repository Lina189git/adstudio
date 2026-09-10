import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/artists/[id] — artist profile + full commission list
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, image: true,
      role: true, createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const commissions = await prisma.commissionRequest.findMany({
    where: { assignedArtistId: params.id },
    select: {
      id: true, reference: true, customerName: true,
      paintingType: true, size: true, style: true, status: true,
      estimatedRange: true, deadline: true, createdAt: true, updatedAt: true,
      workUpdates: { select: { id: true, step: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ user, commissions });
}

// PUT /api/admin/artists/[id] — update name or demote back to USER
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true },
  });

  if (!existing) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const body = await request.json();
  const { name, role } = body as { name?: string | null; role?: string };

  const validRoles = ["USER", "ADMIN", "ARTIST", "VISITOR"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  // Guard: can't demote yourself
  if (role && role !== "ADMIN" && existing.email === session.user?.email) {
    return NextResponse.json({ error: "Cannot change your own role." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name: name?.trim() || null } : {}),
      ...(role ? { role: role as any } : {}),
    },
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
  });

  return NextResponse.json({ user: updated });
}
