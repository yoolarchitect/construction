"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getOrganization } from "@/lib/organization-context";
import { prisma } from "@/lib/prisma";

const PROJECT_STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

export async function createProjectAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const budgetRaw = formData.get("budget") as string;
  const status = (formData.get("status") as string) || "PLANNING";
  const startDateRaw = formData.get("startDate") as string;
  const endDateRaw = formData.get("endDate") as string;
  const clientId = (formData.get("clientId") as string)?.trim() || null;
  const companyId = (formData.get("companyId") as string)?.trim() || null;

  if (!name) return { error: "Name required" };
  const budget = budgetRaw ? parseFloat(budgetRaw) : 0;
  if (Number.isNaN(budget) || budget < 0) return { error: "Valid budget required" };
  if (!startDateRaw) return { error: "Start date required" };

  const startDate = new Date(startDateRaw);
  const endDate = endDateRaw ? new Date(endDateRaw) : null;
  const validStatus = PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number]) ? status : "PLANNING";

  const project = await prisma.project.create({
    data: {
      name,
      description,
      location,
      budget,
      status: validStatus as "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED",
      startDate,
      endDate,
      clientId,
      companyId,
    },
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing project" };

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const budgetRaw = formData.get("budget") as string;
  const status = (formData.get("status") as string) || "PLANNING";
  const startDateRaw = formData.get("startDate") as string;
  const endDateRaw = formData.get("endDate") as string;
  const clientId = (formData.get("clientId") as string)?.trim() || null;
  const companyId = (formData.get("companyId") as string)?.trim() || null;

  if (!name) return { error: "Name required" };
  const budget = budgetRaw ? parseFloat(budgetRaw) : 0;
  if (Number.isNaN(budget) || budget < 0) return { error: "Valid budget required" };
  if (!startDateRaw) return { error: "Start date required" };

  const startDate = new Date(startDateRaw);
  const endDate = endDateRaw ? new Date(endDateRaw) : null;
  const validStatus = PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number]) ? status : "PLANNING";

  await prisma.project.updateMany({
    where: { id },
    data: {
      name,
      description,
      location,
      budget,
      status: validStatus as "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED",
      startDate,
      endDate,
      clientId,
      companyId,
    },
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return null;
}

export async function updateProjectStatusAction(formData: FormData): Promise<void> {
  const projectId = formData.get("projectId") as string;
  const status = formData.get("status") as string;
  if (!projectId) return;
  const validStatus = PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])
    ? status
    : "PLANNING";
  await prisma.project.updateMany({
    where: { id: projectId },
    data: { status: validStatus as "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED" },
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  await prisma.project.deleteMany({ where: { id: projectId } });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

// ---- Project installments ----
export async function createProjectInstallmentAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | null> {
  const projectId = (formData.get("projectId") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();
  const amountRaw = formData.get("amount") as string;
  const dueDateRaw = formData.get("dueDate") as string;

  if (!projectId || !label) return { error: "Label required" };
  const amount = amountRaw ? parseFloat(amountRaw) : 0;
  if (Number.isNaN(amount) || amount < 0) return { error: "Valid amount required" };
  if (!dueDateRaw) return { error: "Due date required" };

  const project = await prisma.project.findFirst({
    where: { id: projectId },
  });
  if (!project) return { error: "Project not found" };

  const dueDate = new Date(dueDateRaw);
  const count = await prisma.projectInstallment.count({
    where: { projectId },
  });

  await prisma.projectInstallment.create({
    data: {
      projectId,
      label,
      amount,
      dueDate,
      sortOrder: count,
    },
  });
  revalidatePath(`/projects/${projectId}`);
  return null;
}

export async function deleteProjectInstallmentAction(formData: FormData): Promise<void> {
  const projectId = (formData.get("projectId") as string)?.trim();
  const installmentId = (formData.get("installmentId") as string)?.trim();
  if (!projectId || !installmentId) return;
  await prisma.projectInstallment.deleteMany({
    where: { id: installmentId, projectId },
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function updateProjectInstallmentAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const projectId = (formData.get("projectId") as string)?.trim();
  const installmentId = (formData.get("installmentId") as string)?.trim();
  const label = (formData.get("label") as string)?.trim();
  const amountRaw = formData.get("amount") as string;
  const dueDateRaw = formData.get("dueDate") as string;

  if (!projectId || !installmentId) return { error: "Missing installment" };
  if (!label) return { error: "Label required" };
  const amount = amountRaw ? parseFloat(amountRaw) : 0;
  if (Number.isNaN(amount) || amount < 0) return { error: "Valid amount required" };
  if (!dueDateRaw) return { error: "Due date required" };

  const dueDate = new Date(dueDateRaw);
  await prisma.projectInstallment.updateMany({
    where: { id: installmentId, projectId },
    data: { label, amount, dueDate },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ---- Project deposits & receipts ----
function formatReceiptNumber(n: number): string {
  return n < 10000 ? n.toString().padStart(4, "0") : n.toString();
}

export async function createProjectDepositAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | { success?: boolean } | null> {
  const org = await getOrganization();
  const projectId = (formData.get("projectId") as string)?.trim();
  const amountRaw = formData.get("amount") as string;
  const paidAtRaw = (formData.get("paidAt") as string)?.trim();
  const reference = (formData.get("reference") as string)?.trim() || null;
  const paymentMethod = (formData.get("paymentMethod") as string)?.trim() || null;
  const accountNo = (formData.get("accountNo") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!projectId) return { error: "Project required" };
  const amount = amountRaw ? parseFloat(amountRaw) : 0;
  if (Number.isNaN(amount) || amount <= 0) return { error: "Valid amount required" };

  const project = await prisma.project.findFirst({
    where: { id: projectId },
  });
  if (!project) return { error: "Project not found" };

  const paidAt = paidAtRaw ? new Date(paidAtRaw) : new Date();

  await prisma.$transaction(async (tx: any) => {
    const t = await tx.organization.update({
      where: { id: org.id },
      data: { lastReceiptNumber: { increment: 1 } },
      select: { lastReceiptNumber: true },
    });
    const receiptNumber = formatReceiptNumber(t.lastReceiptNumber);
    await tx.projectDeposit.create({
      data: {
        projectId,
        amount,
        paidAt,
        reference,
        receiptNumber,
        paymentMethod,
        accountNo,
        notes,
      },
    });
  });
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProjectDepositAction(formData: FormData): Promise<void> {
  const projectId = (formData.get("projectId") as string)?.trim();
  const depositId = (formData.get("depositId") as string)?.trim();
  if (!projectId || !depositId) return;
  await prisma.projectDeposit.deleteMany({
    where: { id: depositId, projectId },
  });
  revalidatePath(`/projects/${projectId}`);
}

// ---- Project documents ----
const ALLOWED_DOC_MIME_PREFIXES = ["image/", "application/pdf"];

export async function createProjectDocumentAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | { success: true } | null> {
  const projectId = (formData.get("projectId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const fileUrl = (formData.get("fileUrl") as string)?.trim();
  const mimeType = (formData.get("mimeType") as string)?.trim();

  if (!projectId || !name || !fileUrl || !mimeType) return { error: "Missing required fields" };
  const allowed = ALLOWED_DOC_MIME_PREFIXES.some((p) => mimeType.toLowerCase().startsWith(p));
  if (!allowed) return { error: "Only images and PDFs are allowed" };

  const project = await prisma.project.findFirst({
    where: { id: projectId },
  });
  if (!project) return { error: "Project not found" };

  const projectDocument = (prisma as unknown as { projectDocument?: { create: (args: { data: object }) => Promise<unknown> } })
    .projectDocument;
  if (!projectDocument) {
    return {
      error:
        "Document storage is not available. Run: npx prisma generate (and npx prisma migrate dev if you haven’t).",
    };
  }

  const docTableMissing =
    "Document tables are missing. Run: npx prisma migrate deploy (then npx prisma generate if needed).";

  try {
    await projectDocument.create({
      data: {
        projectId,
        name,
        fileUrl,
        mimeType,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("does not exist") || (e as { code?: string })?.code === "P2021") {
      return { error: docTableMissing };
    }
    throw e;
  }
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProjectDocumentAction(formData: FormData): Promise<void> {
  const projectId = (formData.get("projectId") as string)?.trim();
  const documentId = (formData.get("documentId") as string)?.trim();
  if (!projectId || !documentId) return;
  const projectDocument = (prisma as unknown as { projectDocument?: { deleteMany: (args: { where: object }) => Promise<unknown> } })
    .projectDocument;
  if (!projectDocument) return;
  try {
    await projectDocument.deleteMany({
      where: { id: documentId, projectId },
    });
  } catch {
    // Table may not exist; ignore so page doesn't crash
  }
  revalidatePath(`/projects/${projectId}`);
}

// ---- Expense documents ----
export async function createExpenseDocumentAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | { success: true } | null> {
  const expenseId = (formData.get("expenseId") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const fileUrl = (formData.get("fileUrl") as string)?.trim();
  const mimeType = (formData.get("mimeType") as string)?.trim();

  if (!expenseId || !name || !fileUrl || !mimeType) return { error: "Missing required fields" };
  const allowed = ALLOWED_DOC_MIME_PREFIXES.some((p) => mimeType.toLowerCase().startsWith(p));
  if (!allowed) return { error: "Only images and PDFs are allowed" };

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId },
    select: { projectId: true },
  });
  if (!expense) return { error: "Expense not found" };

  const expenseDocument = (
    prisma as unknown as { expenseDocument?: { create: (args: { data: object }) => Promise<unknown> } }
  ).expenseDocument;
  if (!expenseDocument) {
    return {
      error:
        "Document storage is not available. Run: npx prisma generate (and npx prisma migrate dev if you haven’t).",
    };
  }

  const docTableMissing =
    "Document tables are missing. Run: npx prisma migrate deploy (then npx prisma generate if needed).";

  try {
    await expenseDocument.create({
      data: {
        expenseId,
        name,
        fileUrl,
        mimeType,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("does not exist") || (e as { code?: string })?.code === "P2021") {
      return { error: docTableMissing };
    }
    throw e;
  }
  revalidatePath(`/projects/${expense.projectId}`);
  return { success: true };
}

export async function deleteExpenseDocumentAction(formData: FormData): Promise<void> {
  const documentId = (formData.get("documentId") as string)?.trim();
  if (!documentId) return;
  const expenseDocument = (
    prisma as unknown as {
      expenseDocument?: {
        findFirst: (args: { where: object; select: object }) => Promise<{ expense: { projectId: string } } | null>;
        deleteMany: (args: { where: object }) => Promise<unknown>;
      };
    }
  ).expenseDocument;
  if (!expenseDocument) return;
  try {
    const doc = await expenseDocument.findFirst({
      where: { id: documentId },
      select: { expense: { select: { projectId: true } } },
    });
    if (!doc) return;
    await expenseDocument.deleteMany({
      where: { id: documentId },
    });
    revalidatePath(`/projects/${doc.expense.projectId}`);
  } catch {
    // Table may not exist; ignore so page doesn't crash
  }
}
