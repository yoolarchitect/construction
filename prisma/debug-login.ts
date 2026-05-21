/**
 * Run from project root: npx tsx prisma/debug-login.ts
 * Simulates app login and logs what each step returns.
 * Uses APP_USER_EMAIL / APP_USER_PASSWORD or defaults from seed.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = process.env.APP_USER_EMAIL || "admin@example.com";
const PASSWORD = process.env.APP_USER_PASSWORD || "changeme";

async function main() {
  console.log("=== Login debug ===\n");
  console.log("Input:", { email: EMAIL, passwordLength: PASSWORD.length });

  const org = await prisma.organization.findFirst({
    select: { id: true, name: true },
  });
  console.log("\n1. Organization:", org ? { id: org.id, name: org.name } : "NOT FOUND (run seed)");
  if (!org) return;

  const emailLower = EMAIL.trim().toLowerCase();
  let user = await prisma.user.findFirst({
    where: {
      email: emailLower,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, email: true, password: true },
  });
  console.log("\n2. User (exact email):", user ? { id: user.id, email: user.email, hasPassword: !!user.password } : "NOT FOUND");

  if (!user) {
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, email: true },
    });
    console.log("   All users:", users.map((u) => u.email));
    return;
  }

  const passwordToTry = PASSWORD.trim();
  let ok = false;
  try {
    ok = await bcrypt.compare(passwordToTry, user.password);
  } catch (e) {
    console.log("\n3. bcrypt.compare threw:", e);
    return;
  }
  console.log("\n3. bcrypt.compare(password, hash):", ok ? "TRUE" : "FALSE");
  console.log("   -> Login would", ok ? "succeed" : "fail (wrong password)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
