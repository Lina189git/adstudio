import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/users/[id]/messages — fetch the support thread with this user,
// marking that user's messages as read
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await prisma.directMessage.updateMany({
    where: { userId: params.id, senderRole: "USER", isRead: false },
    data: { isRead: true },
  });

  const messages = await prisma.directMessage.findMany({
    where: { userId: params.id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json({ messages });
}

// POST /api/admin/users/[id]/messages — admin sends a message to this user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();
  const adminId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const body = await request.json();
  const text = (body?.body || "").trim();
  if (!text) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  const message = await prisma.directMessage.create({
    data: {
      userId: params.id,
      senderId: adminId,
      senderRole: "ADMIN",
      body: text,
    },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
