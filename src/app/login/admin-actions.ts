"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setAdminSession } from "@/lib/auth";

export async function loginAdmin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin || !(await verifyPassword(password, admin.password))) {
    return { error: "Invalid admin credentials" };
  }

  await setAdminSession(admin.id);

  redirect("/");
}

