"use server";

import { getOrganization } from "@/lib/organization-context";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setAppSession, clearAppSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type AppLoginResult = { error?: string } | { success: true };

export async function appLogoutAction() {
  await clearAppSession();
  redirect("/login");
}

export async function tenantLoginAction(
  _prev: unknown,
  formData: FormData
): Promise<AppLoginResult> {
  await getOrganization();
  const emailRaw = (formData.get("email") as string)?.trim() ?? "";
  const email = emailRaw.toLowerCase();
  const password = (formData.get("password") as string)?.trim() ?? "";
  if (!email || !password) return { error: "Email and password required" };

  let user = await prisma.user.findFirst({
    where: {
      email,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, password: true },
  });
  if (!user) {
    const users = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, password: true, email: true },
    });
    user = users.find((u) => u.email.toLowerCase() === email) ?? null;
  }
  if (!user) return { error: "Invalid email or password" };
  const ok = await verifyPassword(password, user.password);
  if (!ok) return { error: "Invalid email or password" };

  await setAppSession(user.id);
  return { success: true };
}
