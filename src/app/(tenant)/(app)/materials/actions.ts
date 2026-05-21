"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createMaterialAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const name = (formData.get("name") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;

  if (!name || !unit) return { error: "Name and unit required" };

  const existing = await prisma.materialCatalog.findFirst({
    where: { name },
  });
  if (existing) return { error: "A material with this name already exists" };

  try {
    await prisma.materialCatalog.create({
      data: {
        name,
        unit,
        category,
      },
    });
  } catch (e: unknown) {
    const isUniqueViolation =
      e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002";
    if (isUniqueViolation) {
      return { error: "A material with this name already exists" };
    }
    throw e;
  }
  revalidatePath("/materials");
  redirect("/materials");
}

export type CreatedMaterial = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
};

export async function createMaterialAndReturnAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | { material: CreatedMaterial }> {
  const name = (formData.get("name") as string)?.trim();
  const unit = (formData.get("unit") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;

  if (!name || !unit) return { error: "Name and unit required" };

  const existing = await prisma.materialCatalog.findFirst({
    where: { name },
  });
  if (existing) return { error: "A material with this name already exists" };

  try {
    const created = await prisma.materialCatalog.create({
      data: {
        name,
        unit,
        category,
      },
    });
    revalidatePath("/materials");
    revalidatePath("/expenses/new");
    return {
      material: {
        id: created.id,
        name: created.name,
        unit: created.unit,
        category: created.category,
      },
    };
  } catch (e: unknown) {
    const isUniqueViolation =
      e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002";
    if (isUniqueViolation) {
      return { error: "A material with this name already exists" };
    }
    throw e;
  }
}
