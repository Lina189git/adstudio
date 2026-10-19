import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail    = process.env.ADMIN_EMAIL    || "admin@adstudio.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName     = process.env.ADMIN_NAME     || "AdStudio Admin";

  console.log(`Upserting admin user: ${adminEmail}`);
  const hashedPassword = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { name: adminName, role: "ADMIN", password: hashedPassword },
    create: { name: adminName, email: adminEmail, password: hashedPassword, role: "ADMIN" },
  });

  console.log(`✓ Admin ready — email: ${adminEmail}  password: ${adminPassword}`);

  // Seed a default product category so the products page is usable immediately
  await prisma.category.upsert({
    where:  { slug: "general" },
    update: {},
    create: { name: "General", slug: "general", description: "General products", sortOrder: 0 },
  });
  console.log("✓ Default category seeded");

  console.log("✓ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
