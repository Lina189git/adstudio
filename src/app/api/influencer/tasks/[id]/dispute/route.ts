import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireInfluencerApiSession, unauthorizedInfluencerResponse } from "@/lib/influencer";

// POST /api/influencer/tasks/[id]/dispute
// Influencer flags a commission payment for review (dispute / refund request)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireInfluencerApiSession();
  if (!session) return unauthorizedInfluencerResponse();
  const influencerId = (session.user as { id: string }).id;

  const task = await prisma.adTask.findFirst({
    where: { id: params.id, influencerId },
    include: { payment: true },
  });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if (!task.payment) return NextResponse.json({ error: "No commission payment found for this task." }, { status: 404 });
  if (task.payment.status === "FAILED") return NextResponse.json({ error: "This payment has already been refunded." }, { status: 409 });

  const body = await request.json();
  const { reason } = body as { reason?: string };
  const disputeNote = `DISPUTE REQUEST: ${(reason?.trim() || "No reason provided")} [submitted ${new Date().toISOString()}]`;

  const updated = await prisma.commissionPayment.update({
    where: { id: task.payment.id },
    data: {
      notes: task.payment.notes
        ? `${task.payment.notes}\n${disputeNote}`
        : disputeNote,
    },
  });

  return NextResponse.json({ ok: true, notes: updated.notes });
}
