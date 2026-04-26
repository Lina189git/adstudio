const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const legacyRoles = ["READER", "AUTHOR", "COAUTHOR"];
  let total = 0;

  for (const role of legacyRoles) {
    const result = await prisma.user.updateMany({
      where: { role },
      data: { role: "USER" },
    });

    total += result.count;
    console.log(`Normalized ${result.count} legacy ${role} user role(s) to USER.`);
  }

  console.log(`Total normalized legacy user roles: ${total}.`);
}

main()
  .catch((error) => {
    console.error("Failed to normalize legacy user roles.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
