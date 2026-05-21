import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@platform.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";

  let admin = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
      },
    });
    console.log("Admin created:", adminEmail);
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: process.env.ORG_NAME || "My Company",
        hasMultipleCompanies: true,
        maxCompanies: 50,
      },
    });
    console.log("Organization created:", org.name);
  } else {
    console.log("Organization already exists:", org.name);
  }

  const appUserEmail = (process.env.APP_USER_EMAIL || "admin@example.com").trim().toLowerCase();
  const appUserPassword = process.env.APP_USER_PASSWORD || "changeme";

  let appUser = await prisma.user.findUnique({ where: { email: appUserEmail } });
  if (!appUser) {
    appUser = await prisma.user.create({
      data: {
        name: process.env.APP_USER_NAME || "Administrator",
        email: appUserEmail,
        password: await bcrypt.hash(appUserPassword.trim(), 12),
        role: "COMPANY_ADMIN",
      },
    });
    console.log("App user created:", appUserEmail);
  } else {
    console.log("App user already exists:", appUserEmail);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
