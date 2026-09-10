import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

// GET /api/admin/tasks/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const task = await prisma.adTask.findUnique({
    where: { id: params.id },
    include: {
      influencer: { select: { id: true, name: true, email: true, image: true } },
      application: { include: { product: true, sample: true } },
      videos: { orderBy: { createdAt: "desc" } },
      payment: true,
    },
  });

  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json(task);
}

// PUT /api/admin/tasks/[id] — update readme, requirements, deadline, status, sample shipping
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const body = await request.json();
  const { readme, requirements, deadline, status, sample } = body;

  const task = await prisma.adTask.findUnique({ where: { id: params.id }, include: { application: { include: { sample: true } } } });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  // Update the task itself
  const updatedTask = await prisma.adTask.update({
    where: { id: params.id },
    data: {
      readme: readme !== undefined ? readme?.trim() || null : undefined,
      requirements: Array.isArray(requirements) ? requirements : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      status: status || undefined,
    },
  });

  // Upsert sample shipping info if provided
  if (sample) {
    await prisma.productSample.upsert({
      where: { applicationId: task.applicationId },
      create: {
        applicationId: task.applicationId,
        trackingNumber: sample.trackingNumber?.trim() || null,
        carrier: sample.carrier?.trim() || null,
        shippingAddress: sample.shippingAddress || null,
        status: sample.status || "PREPARING",
        shippedAt: sample.shippedAt ? new Date(sample.shippedAt) : null,
        deliveredAt: sample.deliveredAt ? new Date(sample.deliveredAt) : null,
        notes: sample.notes?.trim() || null,
      },
      update: {
        trackingNumber: sample.trackingNumber?.trim() || null,
        carrier: sample.carrier?.trim() || null,
        shippingAddress: sample.shippingAddress || undefined,
        status: sample.status || undefined,
        shippedAt: sample.shippedAt ? new Date(sample.shippedAt) : undefined,
        deliveredAt: sample.deliveredAt ? new Date(sample.deliveredAt) : undefined,
        notes: sample.notes?.trim() || null,
      },
    });
  }

  return NextResponse.json(updatedTask);
}
