import React from "react";
import { getOrganization } from "@/lib/organization-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReportFilters } from "../report-filters";
import { ReportPrintButton } from "../report-print-button";
import { ReportBalanceSheet } from "../report-balance-sheet";
import { BalanceSheetExportButtons } from "../balance-sheet-export-buttons";

function parseMonthRange(fromParam: string, toParam: string): { start: Date; end: Date; isDefault: boolean } {
  const from = (fromParam ?? "").trim();
  const to = (toParam ?? "").trim();

  if (from && to) {
    const [fromY, fromM] = from.split("-").map(Number);
    const [toY, toM] = to.split("-").map(Number);
    if (fromY && fromM && toY && toM) {
      const start = new Date(fromY, fromM - 1, 1, 0, 0, 0, 0);
      const end = new Date(toY, toM, 0, 23, 59, 59, 999);
      if (start <= end) return { start, end, isDefault: false };
    }
  }

  // Default: all time up to today
  const start = new Date(2000, 0, 1);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end, isDefault: true };
}

export default async function BalanceSheetReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; companyId?: string }>;
}) {
  const org = await getOrganization();
  const params = await searchParams;
  const toStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const fromParam = toStr(params.from);
  const toParam = toStr(params.to);
  const companyIdParam = toStr(params.companyId);

  const [tenantBranding, companies] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: org.id },
      select: { name: true, logoUrl: true, businessInfo: true },
    }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const tenantName = tenantBranding?.name ?? org.name;
  const tenantLogoUrl = tenantBranding?.logoUrl ?? null;
  const tenantBusinessInfo = tenantBranding?.businessInfo ?? null;

  const { start: rangeStart, end: rangeEnd, isDefault } = parseMonthRange(fromParam, toParam);

  const projectsMatching = await prisma.project.findMany({
    where: { deletedAt: null, ...(companyIdParam ? { companyId: companyIdParam } : {}) },
    select: { id: true, budget: true },
  });
  const projectIds = projectsMatching.map((p) => p.id);
  const totalBudget = projectsMatching.reduce((sum, p) => sum + Number(p.budget), 0);

  const [receivedAgg, expensesAgg, invoicePaymentsAgg, outstandingInvoices, assetsData] = await Promise.all([
    projectIds.length > 0
      ? prisma.projectDeposit.aggregate({
          where: { projectId: { in: projectIds }, paidAt: { lte: rangeEnd } },
          _sum: { amount: true },
        })
      : { _sum: { amount: null as number | null } },
    projectIds.length > 0
      ? prisma.expense.aggregate({
          where: {
            deletedAt: null,
            projectId: { in: projectIds },
            expenseDate: { lte: rangeEnd },
            project: { deletedAt: null },
          },
          _sum: { amount: true },
        })
      : { _sum: { amount: null as number | null } },
    prisma.invoicePayment.aggregate({
      where: {
        paidAt: { lte: rangeEnd },
        invoice: {
          deletedAt: null,
          ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : {}),
        },
      },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: {
        deletedAt: null,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
        ...(projectIds.length > 0 ? { projectId: { in: projectIds } } : {}),
      },
      select: { amount: true, discount: true, payments: { select: { amount: true } } },
    }),
    prisma.asset.findMany({
      where: { ...(companyIdParam ? { companyId: companyIdParam } : {}) },
      select: { category: true, cost: true },
    }),
  ]);

  const depositReceived = Number(receivedAgg._sum.amount ?? 0);
  const invoicePaymentsReceived = Number(invoicePaymentsAgg._sum.amount ?? 0);
  // Use whichever is higher as cash/bank (avoid double-counting by picking invoicePayments if populated)
  const totalReceived = invoicePaymentsReceived > 0 ? invoicePaymentsReceived : depositReceived;
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);

  // Receivables: sum of outstanding balances on sent/partial/overdue invoices
  let receivables = 0;
  for (const inv of outstandingInvoices) {
    const grandTotal = Number(inv.amount) - Number(inv.discount ?? 0);
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    receivables += Math.max(0, grandTotal - paid);
  }

  let fixedAssetsTotal = 0;
  let currentAssetsTotal = 0;
  for (const a of assetsData) {
    const cost = Number(a.cost);
    if (a.category === "FIXED") fixedAssetsTotal += cost;
    else if (a.category === "CURRENT") currentAssetsTotal += cost;
  }

  const balanceSheetData = {
    totalBudget,
    totalReceived,
    totalExpenses,
    receivables,
    netPosition: totalBudget - totalExpenses,
    fixedAssetsTotal,
    currentAssetsTotal,
  };

  const generatedAt = new Date().toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
  const asAtLabel = isDefault
    ? new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : new Date(rangeEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-8 print:space-y-6" id="report-content">
      <div className="flex flex-col gap-4 print:gap-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/reports" className="text-sm font-medium text-teal-600 hover:text-teal-700 print:hidden">← Reports</Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 print:text-xl">Balance Sheet</h1>
            <p className="mt-1 text-sm text-slate-500">As at {asAtLabel}{isDefault ? " (all time)" : ""}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <ReportPrintButton />
            <BalanceSheetExportButtons
              data={balanceSheetData}
              asAtLabel={asAtLabel}
              generatedAt={generatedAt}
              tenantName={tenantName}
              tenantLogoUrl={tenantLogoUrl}
              tenantBusinessInfo={tenantBusinessInfo}
            />
          </div>
        </div>
        <div className="print:hidden">
          <ReportFilters
            basePath="/reports/balance-sheet"
            projects={[]}
            clients={[]}
            companies={companies}
            categories={[]}
            materials={[]}
            showCategoryMaterial={false}
            showClientProject={false}
          />
        </div>
      </div>

      <ReportBalanceSheet
        data={balanceSheetData}
        asAtLabel={asAtLabel}
        generatedAt={generatedAt}
        tenantName={tenantName}
        tenantLogoUrl={tenantLogoUrl}
        tenantBusinessInfo={tenantBusinessInfo}
      />
    </div>
  );
}
