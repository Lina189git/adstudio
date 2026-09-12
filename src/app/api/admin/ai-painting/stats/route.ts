import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/ai-painting/stats
export async function GET() {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const [
    total,
    completed,
    failed,
    byStyle,
    recentSessions,
    totalFrames,
  ] = await Promise.all([
    prisma.aIPaintingSession.count(),
    prisma.aIPaintingSession.count({ where: { status: "COMPLETED" } }),
    prisma.aIPaintingSession.count({ where: { status: "FAILED" } }),
    prisma.aIPaintingSession.groupBy({
      by: ["stylePreset"],
      _count: { _all: true },
      orderBy: { _count: { stylePreset: "desc" } },
    }),
    prisma.aIPaintingSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.frame.count(),
  ]);

  return NextResponse.json({
    total,
    completed,
    failed,
    pending: total - completed - failed,
    successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byStyle: byStyle.map((row) => ({
      style: row.stylePreset,
      count: row._count._all,
    })),
    recentSessions,
    totalFrames,
  });
}
