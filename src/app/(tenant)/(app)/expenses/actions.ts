"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createExpenseAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const projectId = (formData.get("projectId") as string)?.trim();
  const companyId = (formData.get("companyId") as string)?.trim();
  const expenseDateRaw = (formData.get("expenseDate") as string)?.trim();

  if (!projectId) return { error: "Project is required" };

  const materialIdArr = formData.getAll("materialId") as string[];
  const qtyArr = formData.getAll("qty") as string[];
  const unitPriceArr = formData.getAll("unitPrice") as string[];

  const materialCatalog = await prisma.materialCatalog.findMany({
    select: { id: true, name: true },
  });
  const materialById = new Map(materialCatalog.map((m) => [m.id, m.name]));

  const items: { materials: string; quantity: number; unitPrice: number }[] = [];
  for (let i = 0; i < materialIdArr.length; i++) {
    const materialId = (materialIdArr[i] ?? "").trim();
    const materials = materialId ? materialById.get(materialId) ?? "" : "";
    const qty = parseFloat(String(qtyArr[i] ?? "0"));
    const unitPrice = parseFloat(String(unitPriceArr[i] ?? "0"));
    if (!materialId && (Number.isNaN(qty) || qty === 0) && (Number.isNaN(unitPrice) || unitPrice === 0)) continue;
    if (Number.isNaN(qty) || qty < 0 || Number.isNaN(unitPrice) || unitPrice < 0) continue;
    items.push({
      materials: materials || "Item",
      quantity: qty,
      unitPrice,
    });
  }

  if (items.length === 0) return { error: "Add at least one item with quantity and unit price" };

  const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const expenseDate = expenseDateRaw ? new Date(expenseDateRaw) : new Date();

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) return { error: "Project not found" };

  const title = items.length === 1 && items[0].materials !== "Item"
    ? items[0].materials
    : `Daily expenses (${items.length} items)`;

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        projectId,
        companyId: companyId || null,
        title,
        amount: totalAmount,
        quantity: null,
        unitCost: null,
        category: "MATERIAL",
        expenseDate,
      },
    });
    await tx.expenseItem.createMany({
      data: items.map((it) => ({
        expenseId: expense.id,
        materials: it.materials,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    });
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}
