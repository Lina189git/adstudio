import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAccountSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
}

// GET /api/account/messages — the signed-in user's own support thread,
// marking admin messages as read
export async function GET() {
  const session = await requireAccountSession();
  if (!session) return unauthorizedResponse();
  const userId = (session.user as { id: string }).id;

  await prisma.directMessage.updateMany({
    where: { userId, senderRole: "ADMIN", isRead: false },
    data: { isRead: true },
  });

  const messages = await prisma.directMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json({ messages });
}

// POST /api/account/messages — the signed-in user replies to support
export async function POST(request: NextRequest) {
  const session = await requireAccountSession();
  if (!session) return unauthorizedResponse();
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const text = (body?.body || "").trim();
  if (!text) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  const message = await prisma.directMessage.create({
    data: {
      userId,
      senderId: userId,
      senderRole: "USER",
      body: text,
    },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
