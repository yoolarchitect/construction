import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrganization } from "@/lib/organization-context";
import { prisma } from "@/lib/prisma";
import { updateProjectStatusAction } from "../actions";
import { ProjectStatusButton } from "@/components/ProjectStatusButton";
import { ProjectDetailTabs } from "./project-detail-tabs";

type ExpenseDoc = { id: string; expenseId: string; name: string; fileUrl: string; mimeType: string; createdAt: Date };
type ProjectDoc = { id: string; name: string; fileUrl: string; mimeType: string; createdAt: Date };

// Project query result shape (matches schema; use after prisma generate for full type inference)
interface ProjectWithIncludes {
  id: string;
  name: string;
  budget: unknown;
  status: string;
  location: string | null;
  client: { id: string; name: string } | null;
  expenses: Array<{
    id: string;
    title: string;
    amount: unknown;
    expenseDate: Date;
    items: unknown[];
    documents: ExpenseDoc[];
  }>;
  installments: Array<{ id: string; label: string; amount: unknown; dueDate: Date; sortOrder: number }>;
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<string, string> = {
  PLANNING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-teal-100 text-teal-800",
  ON_HOLD: "bg-slate-100 text-slate-700",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const org = await getOrganization();
  const { id } = await params;

  const expenseDocDelegate = (prisma as { expenseDocument?: { findMany: (args: object) => Promise<ExpenseDoc[]> } })
    .expenseDocument;
  const projectDocDelegate = (prisma as { projectDocument?: { findMany: (args: object) => Promise<ProjectDoc[]> } })
    .projectDocument;

  const [projectRaw, expenseDocuments, projectDocuments, invoicePaymentsReceived] = await Promise.all([
    prisma.project.findFirst({
      where: { id },
      include: {
        expenses: {
          include: { items: true },
          orderBy: { expenseDate: "desc" as const },
        },
        client: { select: { id: true, name: true } },
        installments: { orderBy: { sortOrder: "asc" } },
      },
    } as Parameters<typeof prisma.project.findFirst>[0]),
    expenseDocDelegate
      ? expenseDocDelegate
          .findMany({
            where: {
              expense: { projectId: id },
            },
            orderBy: { createdAt: "desc" },
          })
          .catch(() => [] as ExpenseDoc[])
      : Promise.resolve([] as ExpenseDoc[]),
    projectDocDelegate
      ? projectDocDelegate
          .findMany({
            where: { projectId: id },
            orderBy: { createdAt: "desc" },
          })
          .catch(() => [] as ProjectDoc[])
      : Promise.resolve([] as ProjectDoc[]),
    prisma.invoicePayment.aggregate({
      where: { invoice: { projectId: id, deletedAt: null } },
      _sum: { amount: true },
    }),
  ]);
  const project = projectRaw as ProjectWithIncludes | null;
  if (!project) notFound();

  // Attach documents to each expense (avoids include on Expense for compatibility)
  const docsByExpenseId = expenseDocuments.reduce<Record<string, ExpenseDoc[]>>(
    (acc: Record<string, ExpenseDoc[]>, doc: ExpenseDoc) => {
      if (!acc[doc.expenseId]) acc[doc.expenseId] = [];
      acc[doc.expenseId].push(doc);
      return acc;
    },
    {}
  );
  const expensesWithDocuments = project.expenses.map((e: (typeof project.expenses)[number]) => ({
    ...e,
    documents: docsByExpenseId[e.id] ?? [],
  }));
  const installmentsPlain = project.installments.map((i) => ({
    ...i,
    amount: Number(i.amount),
  }));
  const projectWithExpenseDocs = {
    ...project,
    expenses: expensesWithDocuments,
    installments: installmentsPlain,
    documents: projectDocuments,
  };
  const totalExpenses = project.expenses.reduce((s: number, e: (typeof project.expenses)[number]) => s + Number(e.amount), 0);
  const totalReceived = Number(invoicePaymentsReceived._sum.amount ?? 0);
  const budgetNum = Number(project.budget);
  const remaining = Math.max(0, budgetNum - totalExpenses);
  const spendPercent = budgetNum > 0 ? Math.min(100, (totalExpenses / budgetNum) * 100) : 0;

  const isActive = project.status === "ACTIVE" || project.status === "PLANNING";
  const canAddExpense = isActive || project.status === "ON_HOLD";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/projects" className="text-sm font-medium text-slate-500 hover:text-slate-700">
              ← Projects
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {project.name}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_STYLES[project.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/projects/${project.id}/edit`} className="btn btn-secondary text-sm">
                Edit
              </Link>
              {(project.status === "ACTIVE" || project.status === "PLANNING") && (
                <>
                  <ProjectStatusButton
                    action={updateProjectStatusAction}
                    projectId={project.id}
                    status="COMPLETED"
                    label="Mark completed"
                    className="btn btn-secondary text-sm"
                  />
                  <ProjectStatusButton
                    action={updateProjectStatusAction}
                    projectId={project.id}
                    status="ON_HOLD"
                    label="Put on hold"
                    className="btn btn-secondary text-sm"
                  />
                  <ProjectStatusButton
                    action={updateProjectStatusAction}
                    projectId={project.id}
                    status="CANCELLED"
                    label="Cancel project"
                    className="btn btn-danger text-sm"
                  />
                </>
              )}
              {project.status === "ON_HOLD" && (
                <>
                  <ProjectStatusButton
                    action={updateProjectStatusAction}
                    projectId={project.id}
                    status="ACTIVE"
                    label="Reactivate"
                    className="btn btn-primary text-sm"
                  />
                  <ProjectStatusButton
                    action={updateProjectStatusAction}
                    projectId={project.id}
                    status="COMPLETED"
                    label="Mark completed"
                    className="btn btn-secondary text-sm"
                  />
                  <ProjectStatusButton
                    action={updateProjectStatusAction}
                    projectId={project.id}
                    status="CANCELLED"
                    label="Cancel project"
                    className="btn btn-danger text-sm"
                  />
                </>
              )}
              {(project.status === "COMPLETED" || project.status === "CANCELLED") && (
                <ProjectStatusButton
                  action={updateProjectStatusAction}
                  projectId={project.id}
                  status="ACTIVE"
                  label="Reactivate"
                  className="btn btn-primary text-sm"
                />
              )}
            </div>
          </div>
          {(project.location || project.client) && (
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
              {project.location && <span>{project.location}</span>}
              {project.client && (
                <Link
                  href={`/clients`}
                  className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {project.client.name}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status notice when not active */}
      {project.status === "COMPLETED" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="font-semibold">This project is completed.</span>
          <span className="text-emerald-700">No new expenses can be added. Use Edit to change status if needed.</span>
        </div>
      )}
      {project.status === "ON_HOLD" && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">This project is on hold.</span>
          <span className="text-amber-700">You can still add expenses. Use Edit to reactivate the project.</span>
        </div>
      )}
      {project.status === "CANCELLED" && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="font-semibold">This project is cancelled.</span>
          <span className="text-red-700">No new expenses can be added. Use Edit to change status if needed.</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Budget</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(budgetNum)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Received</p>
          <p className="mt-1 text-xl font-bold text-teal-700 sm:text-2xl">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalReceived)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">From invoice payments</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Spent</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalExpenses)}
          </p>
          {budgetNum > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  spendPercent > 90 ? "bg-red-500" : spendPercent > 70 ? "bg-amber-500" : "bg-teal-500"
                }`}
                style={{ width: `${spendPercent}%` }}
              />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Remaining</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(remaining)}
          </p>
        </div>
      </div>

      {/* Tabs: Installments | Receipts | Expenses */}
      <ProjectDetailTabs
        projectId={projectWithExpenseDocs.id}
        installments={projectWithExpenseDocs.installments as Parameters<typeof ProjectDetailTabs>[0]["installments"]}
        expenses={projectWithExpenseDocs.expenses as Parameters<typeof ProjectDetailTabs>[0]["expenses"]}
        documents={projectWithExpenseDocs.documents}
        canAddExpense={canAddExpense}
        organizationId={org.id}
      />
    </div>
  );
}
