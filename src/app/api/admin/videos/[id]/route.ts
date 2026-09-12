import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PUT /api/admin/videos/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const body = await request.json();
  const { status, adminComment, isPublic } = body;

  const video = await prisma.videoSubmission.findUnique({
    where: { id: params.id },
    include: {
      task: {
        include: {
          application: { include: { product: { select: { basePriceCents: true } } } },
          payment: true,
        },
      },
    },
  });
  if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });

  const updatedVideo = await prisma.videoSubmission.update({
    where: { id: params.id },
    data: {
      status: status || undefined,
      adminComment: adminComment?.trim() ?? video.adminComment,
      isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
      approvedAt: status === "APPROVED" && !video.approvedAt ? new Date() : undefined,
    },
  });

  let commissionCreated = false;

  if (status === "APPROVED") {
    await prisma.adTask.update({ where: { id: video.taskId }, data: { status: "APPROVED" } });

    // Auto-create a PENDING commission payment based on the agreed rate/amount
    if (!video.task.payment) {
      const app = video.task.application;
      const basePriceCents = app.product?.basePriceCents ?? 0;
      const amountCents =
        app.agreedAmount != null
          ? app.agreedAmount
          : Math.round((app.agreedRate ?? 0) * basePriceCents);

      if (amountCents > 0) {
        await prisma.commissionPayment.create({
          data: {
            taskId: video.task.id,
            influencerId: video.task.influencerId,
            amountCents,
            status: "PENDING",
          },
        });
        commissionCreated = true;
      }
    }
  }

  return NextResponse.json({ ...updatedVideo, commissionCreated });
}
