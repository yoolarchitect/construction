"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/organization-context";
import { computeInvoiceGrandTotal } from "./invoice-math";

type InvoiceStatus = "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE";

function formatReceiptNumber(n: number): string {
  return n < 10000 ? n.toString().padStart(4, "0") : n.toString();
}

async function reconcileInvoicePaymentStatusTx(tx: any, invoiceId: string) {
  const invoice = await tx.invoice.findFirst({
    where: { id: invoiceId, deletedAt: null },
    include: { items: true, payments: true },
  });
  if (!invoice) return;

  const grandTotal = computeInvoiceGrandTotal(invoice);
  const paidTotal = invoice.payments.reduce((s: number, p: { amount: unknown }) => s + Number(p.amount), 0);

  const previous = invoice.status as InvoiceStatus;
  let status: InvoiceStatus = previous;
  let paidAt: Date | null = invoice.paidAt;

  if (paidTotal <= 0) {
    if (previous === "PAID" || previous === "PARTIAL") {
      status = "SENT";
    }
    paidAt = null;
  } else if (grandTotal > 0 && paidTotal + 1e-6 >= grandTotal) {
    status = "PAID";
    const latestMs = invoice.payments.reduce(
      (max: number, p: { paidAt: Date }) => Math.max(max, new Date(p.paidAt).getTime()),
      0
    );
    paidAt = latestMs ? new Date(latestMs) : new Date();
  } else {
    status = "PARTIAL";
    paidAt = null;
  }

  await tx.invoice.update({
    where: { id: invoiceId },
    data: { status, paidAt },
  });
}

export async function getLatestInvoiceNumber(): Promise<string> {
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: { startsWith: "INV-" },
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  if (!lastInvoice?.invoiceNumber) return "INV-00001";

  const matches = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
  if (!matches) return "INV-00001";

  const nextNum = parseInt(matches[1], 10) + 1;
  return `INV-${nextNum.toString().padStart(5, "0")}`;
}

export async function createInvoice(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  try {
    const projectId = (formData.get("projectId") as string)?.trim();
    const companyId = (formData.get("companyId") as string)?.trim();
    const installmentId = (formData.get("installmentId") as string)?.trim();
    const invoiceNumber = (formData.get("invoiceNumber") as string)?.trim();
    const issueDateRaw = formData.get("issueDate") as string;
    const dueDateRaw = formData.get("dueDate") as string;
    const recipientName = (formData.get("recipientName") as string)?.trim();
    const recipientAddress = (formData.get("recipientAddress") as string)?.trim();
    const notes = (formData.get("notes") as string)?.trim() || null;
    const terms = (formData.get("terms") as string)?.trim() || null;
    const status = (formData.get("status") as InvoiceStatus) || "DRAFT";
    const discount = Number(formData.get("discount")) || 0;

    if (!invoiceNumber) return { error: "Invoice number is required" };
    if (!issueDateRaw) return { error: "Issue date is required" };
    if (!dueDateRaw) return { error: "Due date is required" };
    if (!recipientName) return { error: "Recipient name is required" };

    const issueDate = new Date(issueDateRaw);
    const dueDate = new Date(dueDateRaw);

    const itemsJson = formData.get("items") as string;
    const items = JSON.parse(itemsJson || "[]") as {
      description: string;
      quantity: number;
      unitPrice: number;
    }[];

    if (items.length === 0) return { error: "Add at least one line item" };

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    await prisma.$transaction(async (tx: any) => {
      await tx.invoice.create({
        data: {
          invoiceNumber,
          projectId: projectId || undefined,
          companyId: companyId || undefined,
          installmentId: installmentId || undefined,
          amount: totalAmount,
          discount,
          notes,
          terms,
          status,
          issueDate,
          dueDate,
          recipientName,
          recipientAddress,
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
    });

    revalidatePath("/invoices");
    return { success: true };
  } catch (e: unknown) {
    console.error("Failed to create invoice:", e);
    const message = e instanceof Error ? e.message : "Failed to create invoice";
    return { error: message };
  }
}

export async function updateInvoice(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  try {
    const projectId = (formData.get("projectId") as string)?.trim();
    const companyId = (formData.get("companyId") as string)?.trim();
    const installmentId = (formData.get("installmentId") as string)?.trim();
    const invoiceNumber = (formData.get("invoiceNumber") as string)?.trim();
    const issueDateRaw = formData.get("issueDate") as string;
    const dueDateRaw = formData.get("dueDate") as string;
    const recipientName = (formData.get("recipientName") as string)?.trim();
    const recipientAddress = (formData.get("recipientAddress") as string)?.trim();
    const notes = (formData.get("notes") as string)?.trim() || null;
    const terms = (formData.get("terms") as string)?.trim() || null;
    const status = formData.get("status") as InvoiceStatus;
    const discount = Number(formData.get("discount")) || 0;

    if (!invoiceNumber) return { error: "Invoice number is required" };
    if (!issueDateRaw) return { error: "Issue date is required" };
    if (!dueDateRaw) return { error: "Due date is required" };
    if (!recipientName) return { error: "Recipient name is required" };

    const issueDate = new Date(issueDateRaw);
    const dueDate = new Date(dueDateRaw);

    const itemsJson = formData.get("items") as string;
    const items = JSON.parse(itemsJson || "[]") as {
      id?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }[];

    if (items.length === 0) return { error: "Add at least one line item" };

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    await prisma.$transaction(async (tx: any) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      await tx.invoice.update({
        where: { id },
        data: {
          invoiceNumber,
          projectId: projectId || null,
          companyId: companyId || null,
          installmentId: installmentId || null,
          amount: totalAmount,
          discount,
          notes,
          terms,
          status,
          issueDate,
          dueDate,
          recipientName,
          recipientAddress,
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

      await reconcileInvoicePaymentStatusTx(tx, id);
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    return { success: true };
  } catch (e: unknown) {
    console.error("Failed to update invoice:", e);
    const message = e instanceof Error ? e.message : "Failed to update invoice";
    return { error: message };
  }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  await prisma.$transaction(async (tx: any) => {
    await tx.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });
    await reconcileInvoicePaymentStatusTx(tx, id);
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}

export async function quickMarkInvoicePaid(invoiceId: string): Promise<{ error?: string }> {
  const org = await getOrganization();
  try {
    await prisma.$transaction(async (tx: any) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, deletedAt: null },
        include: { items: true, payments: true },
      });
      if (!invoice) throw new Error("Invoice not found");

      const grandTotal = computeInvoiceGrandTotal(invoice);
      const paidBefore = invoice.payments.reduce((s: number, p: { amount: unknown }) => s + Number(p.amount), 0);
      const remaining = Math.max(0, grandTotal - paidBefore);
      if (remaining <= 0.001) throw new Error("Invoice already fully paid");

      const t = await tx.organization.update({
        where: { id: org.id },
        data: { lastReceiptNumber: { increment: 1 } },
        select: { lastReceiptNumber: true },
      });
      const receiptNumber = formatReceiptNumber(t.lastReceiptNumber);

      await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: remaining,
          paidAt: new Date(),
          receiptNumber,
          paymentMethod: "Cash",
          reference: null,
          accountNo: null,
          notes: null,
        },
      });

      await reconcileInvoicePaymentStatusTx(tx, invoiceId);
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/receipts");
    return {};
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to mark as paid";
    return { error: message };
  }
}

export async function deleteInvoice(id: string) {
  await prisma.invoice.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/invoices");
}

export async function createInvoicePaymentAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const org = await getOrganization();
  const invoiceId = (formData.get("invoiceId") as string)?.trim();
  const amountRaw = formData.get("amount") as string;
  const paidAtRaw = (formData.get("paidAt") as string)?.trim();
  const paymentMethod = (formData.get("paymentMethod") as string)?.trim() || null;
  const reference = (formData.get("reference") as string)?.trim() || null;
  const accountNo = (formData.get("accountNo") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!invoiceId) return { error: "Invoice required" };
  const amount = amountRaw ? parseFloat(amountRaw) : 0;
  if (Number.isNaN(amount) || amount <= 0) return { error: "Valid amount required" };

  try {
    await prisma.$transaction(async (tx: any) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, deletedAt: null },
        include: { items: true, payments: true },
      });
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "DRAFT") {
        throw new Error("Send the invoice before recording payments");
      }

      const grandTotal = computeInvoiceGrandTotal(invoice);
      const paidBefore = invoice.payments.reduce((s: number, p: { amount: unknown }) => s + Number(p.amount), 0);
      const remaining = Math.max(0, grandTotal - paidBefore);
      if (amount > remaining + 0.01) {
        throw new Error(`Amount exceeds balance due ($${remaining.toFixed(2)})`);
      }

      const t = await tx.organization.update({
        where: { id: org.id },
        data: { lastReceiptNumber: { increment: 1 } },
        select: { lastReceiptNumber: true },
      });
      const receiptNumber = formatReceiptNumber(t.lastReceiptNumber);
      const paidAt = paidAtRaw ? new Date(paidAtRaw) : new Date();

      await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount,
          paidAt,
          receiptNumber,
          paymentMethod,
          reference,
          accountNo,
          notes,
        },
      });

      await reconcileInvoicePaymentStatusTx(tx, invoiceId);
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/receipts");
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to record payment";
    return { error: message };
  }
}

export async function deleteInvoicePaymentAction(formData: FormData): Promise<void> {
  const invoiceId = (formData.get("invoiceId") as string)?.trim();
  const paymentId = (formData.get("paymentId") as string)?.trim();
  if (!invoiceId || !paymentId) return;

  await prisma.$transaction(async (tx: any) => {
    await tx.invoicePayment.deleteMany({
      where: { id: paymentId, invoiceId },
    });
    await reconcileInvoicePaymentStatusTx(tx, invoiceId);
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/receipts");
}
