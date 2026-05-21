"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const ASSET_CATEGORIES = ["FIXED", "CURRENT"] as const;

export async function createAssetAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string) || "FIXED";
  const costRaw = formData.get("cost") as string;
  const companyId = (formData.get("companyId") as string)?.trim() || null;

  if (!name) return { error: "Name required" };
  const cost = costRaw ? parseFloat(costRaw) : 0;
  if (Number.isNaN(cost) || cost < 0) return { error: "Valid cost required" };
  const validCategory = ASSET_CATEGORIES.includes(category as (typeof ASSET_CATEGORIES)[number])
    ? category
    : "FIXED";

  await prisma.asset.create({
    data: {
      name,
      category: validCategory as "FIXED" | "CURRENT",
      cost,
      companyId,
    },
  });
  revalidatePath("/assets");
  revalidatePath("/reports/balance-sheet");
  redirect("/assets");
}

export async function updateAssetAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing asset" };

  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string) || "FIXED";
  const costRaw = formData.get("cost") as string;
  const companyId = (formData.get("companyId") as string)?.trim() || null;

  if (!name) return { error: "Name required" };
  const cost = costRaw ? parseFloat(costRaw) : 0;
  if (Number.isNaN(cost) || cost < 0) return { error: "Valid cost required" };
  const validCategory = ASSET_CATEGORIES.includes(category as (typeof ASSET_CATEGORIES)[number])
    ? category
    : "FIXED";

  await prisma.asset.updateMany({
    where: { id },
    data: {
      name,
      category: validCategory as "FIXED" | "CURRENT",
      cost,
      companyId,
    },
  });
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}/edit`);
  revalidatePath("/reports/balance-sheet");
  redirect("/assets");
}

export async function deleteAssetAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing asset" };

  await prisma.asset.deleteMany({ where: { id } });
  revalidatePath("/assets");
  revalidatePath("/reports/balance-sheet");
  redirect("/assets");
}
