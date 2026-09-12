import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdminApiSession,
  unauthorizedAdminResponse,
} from "@/lib/admin";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    const [total, pending, paid] = await Promise.all([
      prisma.paintingOrder.count(),
      prisma.paintingOrder.count({
        where: { status: "PENDING_PAYMENT" },
      }),
      prisma.paintingOrder.count({
        where: { paymentStatus: "PAID" },
      }),
    ]);

    return NextResponse.json({
      total,
      pending,
      paid,
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch order stats" },
      { status: 500 }
    );
  }
}
