import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReportFilters } from "../report-filters";
import { ReportPrintButton } from "../report-print-button";
import { ReportProfitLoss } from "../report-profit-loss";

function parseMonthRange(fromParam: string, toParam: string): { start: Date; end: Date } {
  const now = new Date();
  const [fromY, fromM] = (fromParam || "").split("-").map(Number);
  const [toY, toM] = (toParam || "").split("-").map(Number);

  const hasFrom = fromY && fromM;
  const hasTo = toY && toM;

  if (hasFrom && hasTo) {
    const start = new Date(fromY, fromM - 1, 1, 0, 0, 0, 0);
    const end = new Date(toY, toM, 0, 23, 59, 59, 999);
    if (start <= end) return { start, end };
  }

  // Default: current year Jan → current month
  const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function ProfitLossReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; projectId?: string; clientId?: string; companyId?: string }>;
}) {
  const params = await searchParams;
  const toStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const fromParam = toStr(params.from);
  const toParam = toStr(params.to);
  const projectIdParam = toStr(params.projectId);
  const clientIdParam = toStr(params.clientId);
  const companyIdParam = toStr(params.companyId);

  const [projects, clients, companies] = await Promise.all([
    prisma.project.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, clientId: true } }),
    prisma.client.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const materials = await prisma.materialCatalog.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true },
  });
  const categories = Array.from(new Set(materials.map((m) => m.category).filter(Boolean))) as string[];
  categories.sort();

  const { start: rangeStart, end: rangeEnd } = parseMonthRange(fromParam, toParam);

  const projectWhere = {
    deletedAt: null,
    ...(projectIdParam ? { id: projectIdParam } : {}),
    ...(clientIdParam ? { clientId: clientIdParam } : {}),
    ...(companyIdParam ? { companyId: companyIdParam } : {}),
  };
  const projectsMatching = await prisma.project.findMany({ where: projectWhere, select: { id: true } });
  const projectIds = projectsMatching.map((p) => p.id);

  const [depositsInPeriod, invoicePaymentsInPeriod, expensesInPeriod] = await Promise.all([
    projectIds.length > 0
      ? prisma.projectDeposit.findMany({
          where: { projectId: { in: projectIds }, paidAt: { gte: rangeStart, lte: rangeEnd } },
          select: { amount: true },
        })
      : [],
    prisma.invoicePayment.findMany({
      where: {
        paidAt: { gte: rangeStart, lte: rangeEnd },
        invoice: {
          deletedAt: null,
          ...(projectIdParam ? { projectId: projectIdParam } : projectIds.length > 0 ? { projectId: { in: projectIds } } : {}),
        },
      },
      select: { amount: true },
    }),
    projectIds.length > 0
      ? prisma.expense.findMany({
          where: {
            deletedAt: null,
            projectId: { in: projectIds },
            expenseDate: { gte: rangeStart, lte: rangeEnd },
            project: { deletedAt: null },
          },
          select: { amount: true, category: true },
        })
      : [],
  ]);

  const depositIncome = depositsInPeriod.reduce((s, d) => s + Number(d.amount), 0);
  const invoiceIncome = invoicePaymentsInPeriod.reduce((s, p) => s + Number(p.amount), 0);
  // Use invoice payments as primary income; fall back to deposits if no invoices tracked
  const income = invoiceIncome > 0 ? invoiceIncome : depositIncome;
  const incomeBreakdown = { invoicePayments: invoiceIncome, projectDeposits: depositIncome };

  const byCategory = new Map<string, number>();
  for (const e of expensesInPeriod) {
    const amt = Number(e.amount);
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + amt);
  }
  const totalExpenses = expensesInPeriod.reduce((s, e) => s + Number(e.amount), 0);
  const order = ["MATERIAL", "LABOR", "EQUIPMENT", "SUBCONTRACT", "OTHER"];
  const expensesByCategory = order
    .filter((c) => byCategory.has(c))
    .map((category) => ({ category, amount: byCategory.get(category)! }));

  const pnlData = { income, incomeBreakdown, expensesByCategory, totalExpenses, netProfit: income - totalExpenses };

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-01`;
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const effectiveFrom = fromParam || defaultFrom;
  const effectiveTo = toParam || defaultTo;
  const fromLabel = new Date(effectiveFrom + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const toLabel = new Date(effectiveTo + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const periodLabel = fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
  const generatedAt = new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="space-y-8 print:space-y-6" id="report-content">
      <div className="flex flex-col gap-4 print:gap-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/reports" className="text-sm font-medium text-teal-600 hover:text-teal-700 print:hidden">← Reports</Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 print:text-xl">Profit & Loss</h1>
            <p className="mt-1 text-sm text-slate-500">Period: {periodLabel}</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <ReportPrintButton />
          </div>
        </div>
        <div className="print:hidden">
          <ReportFilters
            basePath="/reports/profit-loss"
            projects={projects}
            clients={clients}
            companies={companies}
            categories={categories}
            materials={materials.map((m) => ({ id: m.id, name: m.name, category: m.category }))}
            showCategoryMaterial={false}
          />
        </div>
      </div>

      <ReportProfitLoss data={pnlData} periodLabel={periodLabel} generatedAt={generatedAt} />
    </div>
  );
}
