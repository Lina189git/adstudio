import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdminApiSession,
  unauthorizedAdminResponse,
} from "@/lib/admin";
import { normalizeAdminProductVariants } from "@/lib/adminProductVariants";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/admin/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: {
          orderBy: { priceCents: 'asc' },
        },
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      shortDescription,
      basePriceCents,
      categoryId,
      imageUrl,
      galleryImages,
      isActive,
      isFeatured,
      stockQuantity,
      variants,
    } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if category exists (if provided)
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        );
      }
    }

    // Check slug uniqueness (if changed)
    if (slug && slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Product slug already exists' },
          { status: 400 }
        );
      }
    }

    const nextSlug = slug || existingProduct.slug;
    const normalizedVariants = Array.isArray(variants)
      ? normalizeAdminProductVariants(variants, nextSlug)
      : null;

    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: params.id },
        data: {
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description !== undefined && { description }),
          ...(shortDescription !== undefined && { shortDescription }),
          ...(basePriceCents !== undefined && { basePriceCents }),
          ...(categoryId && { categoryId }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(galleryImages !== undefined && {
            galleryImages: Array.isArray(galleryImages) ? galleryImages : [],
          }),
          ...(isActive !== undefined && { isActive }),
          ...(isFeatured !== undefined && { isFeatured }),
          ...(stockQuantity !== undefined && { stockQuantity }),
        },
      });

      if (normalizedVariants) {
        const existingVariantIds = new Set(existingProduct.variants.map((variant) => variant.id));
        const incomingVariantIds = new Set(
          normalizedVariants
            .map((variant) => variant.id)
            .filter((value): value is string => Boolean(value))
        );

        for (const variant of normalizedVariants) {
          if (variant.id && existingVariantIds.has(variant.id)) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                name: variant.name,
                sku: variant.sku,
                canvasSize: variant.canvasSize,
                frameStyle: variant.frameStyle,
                previewImageUrl: variant.previewImageUrl,
                details: variant.details,
                priceCents: variant.priceCents,
                stockQuantity: variant.stockQuantity,
                isActive: variant.isActive,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: params.id,
                name: variant.name,
                sku: variant.sku,
                canvasSize: variant.canvasSize,
                frameStyle: variant.frameStyle,
                previewImageUrl: variant.previewImageUrl,
                details: variant.details,
                priceCents: variant.priceCents,
                stockQuantity: variant.stockQuantity,
                isActive: variant.isActive,
              },
            });
          }
        }

        const missingVariantIds = existingProduct.variants
          .filter((variant) => !incomingVariantIds.has(variant.id))
          .map((variant) => variant.id);

        if (missingVariantIds.length > 0) {
          await tx.productVariant.updateMany({
            where: { id: { in: missingVariantIds } },
            data: { isActive: false },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: params.id },
        include: {
          category: true,
          variants: {
            orderBy: { priceCents: "asc" },
          },
        },
      });
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAdminApiSession();

    if (!session) {
      return unauthorizedAdminResponse();
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product has been ordered
    if (product._count.orderItems > 0) {
      // Soft delete - mark as inactive instead of hard delete
      await prisma.product.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: 'Product deactivated (has existing orders)',
      });
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
