import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdminApiSession,
  unauthorizedAdminResponse,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/admin/orders/[id] - Get single order
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    const order = await prisma.paintingOrder.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders/[id] - Update order
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    const body = await request.json();
    const { status, trackingNumber, notes, timelineEstimate } = body;

    // Check if order exists
    const existingOrder = await prisma.paintingOrder.findUnique({
      where: { id: params.id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "CANCELLED" && existingOrder.paymentStatus === "PENDING") {
        updateData.paymentStatus = "CANCELLED";
      }
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (timelineEstimate !== undefined) {
      updateData.timelineEstimate = timelineEstimate;
    }

    const order = await prisma.paintingOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
