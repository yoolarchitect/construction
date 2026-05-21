"use server";

import { revalidatePath } from "next/cache";
import { getOrganization } from "@/lib/organization-context";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateOrganizationSettingsAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await getUserFromSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const org = await getOrganization();
  const name = (formData.get("name") as string)?.trim();
  const businessInfo = (formData.get("businessInfo") as string)?.trim() || null;
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
  const faviconUrl = (formData.get("faviconUrl") as string)?.trim() || null;

  if (!name) return { error: "Company name is required" };

  await prisma.organization.update({
    where: { id: org.id },
    data: { name, businessInfo, logoUrl, faviconUrl },
  });

  revalidatePath("/settings");
  revalidatePath("/projects/[id]", "page");
  revalidatePath("/");
  return null;
}
