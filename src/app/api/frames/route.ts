import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/frames — public list of active frames for the studio UI
export async function GET() {
  try {
    const frames = await prisma.frame.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ frames });
  } catch {
    return NextResponse.json({ frames: [] });
  }
}
