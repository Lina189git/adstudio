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

    const [total, admins, visitors] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "VISITOR" } }),
    ]);

    return NextResponse.json({
      total,
      admins,
      visitors,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
