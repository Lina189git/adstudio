import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";

export const dynamic = "force-dynamic";

// GET /api/influencer/tasks/[id]/messages — fetch the thread, marking admin messages as read
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const task = await prisma.adTask.findFirst({ where: { id: params.id, influencerId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  await prisma.message.updateMany({
    where: { taskId: params.id, senderRole: "ADMIN", isRead: false },
    data: { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: { taskId: params.id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json({ messages });
}

// POST /api/influencer/tasks/[id]/messages — influencer replies to the brand
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const task = await prisma.adTask.findFirst({ where: { id: params.id, influencerId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const body = await request.json();
  const text = (body?.body || "").trim();
  if (!text) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  const message = await prisma.message.create({
    data: {
      taskId: params.id,
      senderId: influencerId,
      senderRole: "INFLUENCER",
      body: text,
    },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
