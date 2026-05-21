"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createClientAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;

  if (!name) return { error: "Name required" };

  await prisma.client.create({
    data: {
      name,
      email,
      phone,
      address,
    },
  });
  revalidatePath("/clients");
  redirect("/clients");
}
