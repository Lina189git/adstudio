import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/products
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminApiSession();
    if (!session) return unauthorizedAdminResponse();

    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get("page")  || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const search   = searchParams.get("search");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.categoryId = category;
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/admin/products
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApiSession();
    if (!session) return unauthorizedAdminResponse();

    const body = await request.json();
    const {
      name, slug, description, shortDescription,
      basePriceCents, categoryId, imageUrl, galleryImages,
      isActive, isFeatured, stockQuantity,
      commissionType, commissionRate, commissionFixed,
      sampleStock, taskRequirements,
    } = body;

    if (!name || !slug || !categoryId || basePriceCents === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Product slug already exists" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description:      description      ?? null,
        shortDescription: shortDescription ?? null,
        basePriceCents,
        categoryId,
        imageUrl:     imageUrl ?? null,
        galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
        isActive:      isActive !== false,
        isFeatured:    isFeatured || false,
        stockQuantity: stockQuantity || 0,
        commissionType:  commissionType  || "PERCENTAGE",
        commissionRate:  commissionRate  !== undefined ? commissionRate  : 0.10,
        commissionFixed: commissionFixed !== undefined ? commissionFixed : 0,
        sampleStock:     sampleStock     !== undefined ? sampleStock     : 0,
        taskRequirements: taskRequirements || null,
      },
      include: { category: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
