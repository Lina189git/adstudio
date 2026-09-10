import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

// PUT /api/admin/ad-payments/[id]
// body: { action: "approve" | "pay" | "refund" | "update_amount", paymentRef?, amountCents? }
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const body = await request.json();
  const { action, paymentRef, amountCents, notes } = body;

  const payment = await prisma.commissionPayment.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  let data: Record<string, unknown> = {};

  if (action === "approve") {
    if (payment.status !== "PENDING")
      return NextResponse.json({ error: "Only PENDING payments can be approved." }, { status: 400 });
    data = {
      status: "APPROVED",
      approvedBy: (session.user as { id?: string }).id,
      ...(amountCents != null ? { amountCents: Number(amountCents) } : {}),
    };
  } else if (action === "pay") {
    if (payment.status !== "APPROVED")
      return NextResponse.json({ error: "Payment must be approved before issuing." }, { status: 400 });
    data = {
      status: "PAID",
      paidAt: new Date(),
      paymentRef: paymentRef?.trim() || null,
      notes: notes?.trim() || null,
    };
    // Mark task as COMPLETED when check is issued
    const task = await prisma.adTask.findFirst({ where: { id: payment.taskId } });
    if (task) await prisma.adTask.update({ where: { id: task.id }, data: { status: "COMPLETED" } });
  } else if (action === "refund") {
    if (payment.status !== "PAID")
      return NextResponse.json({ error: "Only paid commissions can be refunded." }, { status: 400 });
    data = { status: "FAILED", notes: notes?.trim() || "Refunded" };
  } else if (action === "update_amount") {
    if (payment.status === "PAID")
      return NextResponse.json({ error: "Cannot change amount of a paid commission." }, { status: 400 });
    data = { amountCents: Math.round(Number(amountCents)) };
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const updated = await prisma.commissionPayment.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}
