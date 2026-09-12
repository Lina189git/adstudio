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

    const [total, featured, inactive] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isFeatured: true, isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
    ]);

    return NextResponse.json({
      total,
      featured,
      inactive,
    });
  } catch (error) {
    console.error("Error fetching product stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch product stats" },
      { status: 500 }
    );
  }
}
