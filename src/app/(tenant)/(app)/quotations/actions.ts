"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export async function getLatestQuotationNumber(): Promise<string> {
  const last = await prisma.quotation.findFirst({
    where: { quotationNumber: { startsWith: "QUO-" }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { quotationNumber: true },
  });

  if (!last?.quotationNumber) return "QUO-00001";
  const m = last.quotationNumber.match(/QUO-(\d+)/);
  if (!m) return "QUO-00001";
  const next = parseInt(m[1], 10) + 1;
  return `QUO-${next.toString().padStart(5, "0")}`;
}

export async function createQuotation(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  try {
    const projectId = (formData.get("projectId") as string)?.trim();
    const companyId = (formData.get("companyId") as string)?.trim();
    const quotationNumber = (formData.get("quotationNumber") as string)?.trim();
    const issueDateRaw = formData.get("issueDate") as string;
    const validUntilRaw = formData.get("validUntil") as string;
    const recipientName = (formData.get("recipientName") as string)?.trim();
    const recipientAddress = (formData.get("recipientAddress") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const terms = (formData.get("terms") as string)?.trim() || null;
    const status = (formData.get("status") as QuotationStatus) || "DRAFT";
    const discount = Number(formData.get("discount")) || 0;

    if (!quotationNumber) return { error: "Quotation number is required" };
    if (!issueDateRaw) return { error: "Issue date is required" };
    if (!validUntilRaw) return { error: "Valid until date is required" };
    if (!recipientName) return { error: "Recipient name is required" };

    const issueDate = new Date(issueDateRaw);
    const validUntil = new Date(validUntilRaw);

    const itemsJson = formData.get("items") as string;
    const items = JSON.parse(itemsJson || "[]") as {
      description: string;
      quantity: number;
      unitPrice: number;
    }[];

    if (items.length === 0) return { error: "Add at least one line item" };

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    await prisma.quotation.create({
      data: {
        quotationNumber,
        projectId: projectId || undefined,
        companyId: companyId || undefined,
        recipientName,
        recipientAddress,
        notes,
        terms,
        status,
        issueDate,
        validUntil,
        discount,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
    });

    revalidatePath("/quotations");
    return { success: true };
  } catch (e: unknown) {
    console.error("Failed to create quotation:", e);
    return { error: e instanceof Error ? e.message : "Failed to create quotation" };
  }
}

export async function updateQuotation(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  try {
    const projectId = (formData.get("projectId") as string)?.trim();
    const companyId = (formData.get("companyId") as string)?.trim();
    const quotationNumber = (formData.get("quotationNumber") as string)?.trim();
    const issueDateRaw = formData.get("issueDate") as string;
    const validUntilRaw = formData.get("validUntil") as string;
    const recipientName = (formData.get("recipientName") as string)?.trim();
    const recipientAddress = (formData.get("recipientAddress") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const terms = (formData.get("terms") as string)?.trim() || null;
    const status = formData.get("status") as QuotationStatus;
    const discount = Number(formData.get("discount")) || 0;

    if (!quotationNumber) return { error: "Quotation number is required" };
    if (!issueDateRaw) return { error: "Issue date is required" };
    if (!validUntilRaw) return { error: "Valid until date is required" };
    if (!recipientName) return { error: "Recipient name is required" };

    const issueDate = new Date(issueDateRaw);
    const validUntil = new Date(validUntilRaw);

    const itemsJson = formData.get("items") as string;
    const items = JSON.parse(itemsJson || "[]") as {
      description: string;
      quantity: number;
      unitPrice: number;
    }[];

    if (items.length === 0) return { error: "Add at least one line item" };

    const totalAmount = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);

    await prisma.$transaction(async (tx: any) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      await tx.quotation.update({
        where: { id },
        data: {
          quotationNumber,
          projectId: projectId || null,
          companyId: companyId || null,
          recipientName,
          recipientAddress,
          notes,
          terms,
          status,
          issueDate,
          validUntil,
          discount,
          items: {
            create: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
        },
      });
    });

    revalidatePath("/quotations");
    revalidatePath(`/quotations/${id}`);
    return { success: true };
  } catch (e: unknown) {
    console.error("Failed to update quotation:", e);
    return { error: e instanceof Error ? e.message : "Failed to update quotation" };
  }
}

export async function deleteQuotation(id: string) {
  await prisma.quotation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/quotations");
}

export async function convertQuotationToInvoice(
  quotationId: string
): Promise<{ error?: string; invoiceId?: string }> {
  try {
    const quotation = await prisma.quotation.findFirst({
      where: { id: quotationId, deletedAt: null },
      include: { items: true },
    });
    if (!quotation) return { error: "Quotation not found" };
    if (quotation.convertedToInvoiceId) return { error: "Already converted to an invoice" };

    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: "INV-" }, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });
    let nextInvoiceNumber = "INV-00001";
    if (lastInvoice?.invoiceNumber) {
      const m = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
      if (m) nextInvoiceNumber = `INV-${(parseInt(m[1], 10) + 1).toString().padStart(5, "0")}`;
    }

    const subtotal = quotation.items.reduce((s, i) => s + Number(i.amount), 0);

    const result = await prisma.$transaction(async (tx: any) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: nextInvoiceNumber,
          projectId: quotation.projectId || undefined,
          companyId: quotation.companyId || undefined,
          recipientName: quotation.recipientName,
          recipientAddress: quotation.recipientAddress,
          notes: quotation.notes,
          terms: quotation.terms,
          discount: quotation.discount,
          amount: subtotal,
          status: "SENT",
          issueDate: new Date(),
          dueDate: quotation.validUntil,
          items: {
            create: quotation.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          },
        },
      });

      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: "ACCEPTED", convertedToInvoiceId: invoice.id },
      });

      return invoice;
    });

    revalidatePath("/quotations");
    revalidatePath("/invoices");
    return { invoiceId: result.id };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to convert quotation" };
  }
}
