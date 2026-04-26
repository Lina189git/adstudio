const { PrismaClient } = require('@prisma/client');

async function seed() {
  const prisma = new PrismaClient();

  try {
    console.log('Clearing existing data...');
    await prisma.paintingOrder.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    console.log('Creating categories...');
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: "Portraits",
          slug: "portraits",
          description: "Oil paintings of people, capturing personality and emotion",
          sortOrder: 1,
        },
      }),
      prisma.category.create({
        data: {
          name: "Landscapes",
          slug: "landscapes",
          description: "Scenic oil paintings of nature, mountains, and seascapes",
          sortOrder: 2,
        },
      }),
    ]);

    console.log('Creating products...');
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: "Classic Portrait",
          slug: "classic-portrait",
          description: "A timeless oil portrait capturing the essence of the subject.",
          shortDescription: "Timeless oil portrait",
          basePriceCents: 8900,
          categoryId: categories[0].id,
          isFeatured: true,
          stockQuantity: 10,
        },
      }),
      prisma.product.create({
        data: {
          name: "Mountain Landscape",
          slug: "mountain-landscape",
          description: "Majestic mountain landscape oil painting.",
          shortDescription: "Dramatic mountain landscape",
          basePriceCents: 12900,
          categoryId: categories[1].id,
          isFeatured: true,
          stockQuantity: 8,
        },
      }),
    ]);

    console.log('Creating variants...');
    await Promise.all([
      // Portrait variants
      prisma.productVariant.create({
        data: {
          productId: products[0].id,
          name: "12x16 Black Wood Frame",
          sku: "CLASSIC-PORTRAIT-12X16-BLACK",
          canvasSize: "12x16",
          frameStyle: "black_wood",
          priceCents: 2500,
          stockQuantity: 5,
        },
      }),
      prisma.productVariant.create({
        data: {
          productId: products[0].id,
          name: "16x20 Gold Gallery Frame",
          sku: "CLASSIC-PORTRAIT-16X20-GOLD",
          canvasSize: "16x20",
          frameStyle: "gold_gallery",
          priceCents: 4500,
          stockQuantity: 3,
        },
      }),
      // Landscape variants
      prisma.productVariant.create({
        data: {
          productId: products[1].id,
          name: "24x36 Walnut Frame",
          sku: "MOUNTAIN-LANDSCAPE-24X36-WALNUT",
          canvasSize: "24x36",
          frameStyle: "walnut",
          priceCents: 6000,
          stockQuantity: 2,
        },
      }),
    ]);

    console.log('Creating demo order...');
    await prisma.paintingOrder.create({
      data: {
        reference: "DEMO-001",
        customerName: "Demo User",
        email: "demo@example.com",
        amountCents: 15000,
        status: "COMPLETED",
        paymentStatus: "PAID",
        shareToGallery: true,
        galleryTitle: "Demo Painting",
        galleryDisplayName: "Demo Artist",
      },
    });

    console.log('✓ Seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();