const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Creating test category...');
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category for seeding',
      },
    });
    console.log('✓ Created category:', category.name);

    console.log('Creating test product...');
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test product',
        basePriceCents: 10000,
        categoryId: category.id,
      },
    });
    console.log('✓ Created product:', product.name);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();