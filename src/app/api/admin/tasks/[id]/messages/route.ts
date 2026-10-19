import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/tasks/[id]/messages — fetch the thread, marking influencer messages as read
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const task = await prisma.adTask.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  await prisma.message.updateMany({
    where: { taskId: params.id, senderRole: "INFLUENCER", isRead: false },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: { taskId: params.id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json({ messages });
}

// POST /api/admin/tasks/[id]/messages — admin sends a message to the influencer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();
  const adminId = (session.user as { id: string }).id;

  const task = await prisma.adTask.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const body = await request.json();
  const text = (body?.body || "").trim();
  if (!text) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      taskId: params.id,
      senderId: adminId,
      senderRole: "ADMIN",
      body: text,
    },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
