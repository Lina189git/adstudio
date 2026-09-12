import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// PUT /api/admin/applications/[id] â€” approve, reject, or update application
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const body = await request.json();
  const { status, adminNotes, agreedRate, agreedAmount } = body;

  const application = await prisma.adApplication.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const updated = await prisma.adApplication.update({
    where: { id: params.id },
    data: {
      status: status || undefined,
      adminNotes: adminNotes?.trim() ?? application.adminNotes,
      agreedRate: agreedRate != null ? Number(agreedRate) : application.agreedRate,
      agreedAmount: agreedAmount != null ? Number(agreedAmount) : application.agreedAmount,
      approvedAt: status === "APPROVED" && !application.approvedAt ? new Date() : application.approvedAt,
      rejectedAt: status === "REJECTED" && !application.rejectedAt ? new Date() : application.rejectedAt,
    },
  });

  // Auto-create AdTask when approving
  if (status === "APPROVED") {
    const existingTask = await prisma.adTask.findUnique({ where: { applicationId: params.id } });
    if (!existingTask) {
      await prisma.adTask.create({
        data: {
          applicationId: params.id,
          productId: application.productId,
          influencerId: application.influencerId,
        },
      });
    }
  }

  return NextResponse.json(updated);
}

// DELETE /api/admin/applications/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  await prisma.adApplication.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
