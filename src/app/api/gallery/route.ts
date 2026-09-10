import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/gallery — public product listing for influencer gallery
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = 12;
  const skip = (page - 1) * limit;
  const search = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category") || "";

  const where = {
    isActive: true,
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] } : {}),
    ...(category ? { category: { slug: category } } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, pagination: { page, pages: Math.ceil(total / limit), total } });
}
