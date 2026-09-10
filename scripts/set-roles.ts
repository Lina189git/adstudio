import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function ensureUser(email: string, name: string, role: UserRole, password: string) {
  const pw = await hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.updateMany({ where: { email }, data: { role, name, password: pw } });
    console.log(`✓ Updated  ${role.padEnd(10)} ${email}`);
  } else {
    await prisma.user.create({ data: { email, name, role, password: pw } });
    console.log(`✓ Created  ${role.padEnd(10)} ${email}`);
  }
}

async function main() {
  await ensureUser("linahuo189@gmail.com",    "Lina (Admin)",    UserRole.ADMIN,      "test123!");
  await ensureUser("influencer@adstudio.com", "Demo Influencer", UserRole.INFLUENCER, "test123!");
  await ensureUser("admin@oilpaint.com",      "AdStudio Admin",  UserRole.ADMIN,      "test123!");

  console.log("\nAccounts ready:");
  console.log("  linahuo189@gmail.com      → ADMIN       (pw: test123!)");
  console.log("  influencer@adstudio.com   → INFLUENCER  (pw: test123!)");
  console.log("  admin@oilpaint.com        → ADMIN       (pw: test123!)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
