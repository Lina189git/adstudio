import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET  /api/admin/artists — roster with commission counts
export async function GET() {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const [artists, stats] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ARTIST" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: { select: { artistCommissions: true } },
      },
      orderBy: { name: "asc" },
    }),
    // aggregate commission statuses across all artists
    prisma.commissionRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  // per-artist commission breakdown
  const artistIds = artists.map((a) => a.id);
  const commissionRows = await prisma.commissionRequest.findMany({
    where: { assignedArtistId: { in: artistIds } },
    select: { assignedArtistId: true, status: true },
  });

  const activeStatuses  = new Set(["ASSIGNED", "IN_PROGRESS", "REVIEW", "REVISION"]);
  const countsByArtist  = artistIds.reduce<Record<string, { active: number; completed: number; total: number }>>(
    (acc, id) => { acc[id] = { active: 0, completed: 0, total: 0 }; return acc; },
    {}
  );
  for (const row of commissionRows) {
    if (!row.assignedArtistId) continue;
    const c = countsByArtist[row.assignedArtistId];
    if (!c) continue;
    c.total++;
    if (activeStatuses.has(row.status)) c.active++;
    if (row.status === "COMPLETED")     c.completed++;
  }

  const roster = artists.map((a) => ({
    ...a,
    counts: countsByArtist[a.id] ?? { active: 0, completed: 0, total: 0 },
  }));

  const totalActive    = stats.filter((s) => activeStatuses.has(s.status)).reduce((n, s) => n + s._count.id, 0);
  const totalCompleted = stats.find((s) => s.status === "COMPLETED")?._count.id ?? 0;

  return NextResponse.json({ artists: roster, totalActive, totalCompleted });
}

// POST /api/admin/artists — promote a user to ARTIST by id or email
export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession();
  if (!session) return unauthorizedAdminResponse();

  const { userId, email } = await request.json();

  if (!userId && !email) {
    return NextResponse.json({ error: "userId or email required." }, { status: 400 });
  }

  const where = userId ? { id: String(userId) } : { email: String(email).toLowerCase().trim() };
  const user = await prisma.user.findUnique({ where, select: { id: true, role: true, name: true, email: true } });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data:  { role: "ARTIST" },
    select: { id: true, name: true, email: true, role: true, image: true, createdAt: true },
  });

  return NextResponse.json({ user: updated });
}
