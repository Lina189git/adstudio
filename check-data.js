const { PrismaClient } = require('@prisma/client');

async function checkData() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({ include: { category: true } });
    console.log('Products:', products.length);
    products.forEach(p => console.log(`- ${p.name} (${p.category.name})`));

    const categories = await prisma.category.findMany();
    console.log('Categories:', categories.length);
    categories.forEach(c => console.log(`- ${c.name}`));

    const variants = await prisma.productVariant.findMany();
    console.log('Variants:', variants.length);

    const orders = await prisma.paintingOrder.findMany();
    console.log('Orders:', orders.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();