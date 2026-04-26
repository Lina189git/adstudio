import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdminApiSession,
  unauthorizedAdminResponse,
} from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.paintingOrder.count();
    const totalProducts = await prisma.product.count();

    const revenueResult = await prisma.paintingOrder.aggregate({
      _sum: {
        amountCents: true,
      },
      where: {
        paymentStatus: "PAID",
      },
    });

    const totalRevenueCents = revenueResult._sum.amountCents || 0;

    const recentOrders = await prisma.paintingOrder.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedRecentOrders = recentOrders.map((order) => ({
      id: order.id,
      user: order.user?.name || order.user?.email || order.customerName,
      totalCents: order.amountCents,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenueCents,
      recentOrders: formattedRecentOrders,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
