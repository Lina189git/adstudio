import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApiSession, unauthorizedAdminResponse } from "@/lib/admin";

export const dynamic = "force-dynamic";

interface RouteParams { params: { id: string } }

// GET /api/admin/products/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminApiSession();
    if (!session) return unauthorizedAdminResponse();

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }

    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.product.findUnique({ where: { slug } });
      if (slugTaken) return NextResponse.json({ error: "Product slug already exists" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name              !== undefined && { name }),
        ...(slug              !== undefined && { slug }),
        ...(description       !== undefined && { description }),
        ...(shortDescription  !== undefined && { shortDescription }),
        ...(basePriceCents    !== undefined && { basePriceCents }),
        ...(categoryId        !== undefined && { categoryId }),
        ...(imageUrl          !== undefined && { imageUrl }),
        ...(galleryImages     !== undefined && { galleryImages: Array.isArray(galleryImages) ? galleryImages : [] }),
        ...(isActive          !== undefined && { isActive }),
        ...(isFeatured        !== undefined && { isFeatured }),
        ...(stockQuantity     !== undefined && { stockQuantity }),
        ...(commissionType    !== undefined && { commissionType }),
        ...(commissionRate    !== undefined && { commissionRate }),
        ...(commissionFixed   !== undefined && { commissionFixed }),
        ...(sampleStock       !== undefined && { sampleStock }),
        ...(taskRequirements  !== undefined && { taskRequirements }),
      },
      include: { category: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminApiSession();
    if (!session) return unauthorizedAdminResponse();

    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
