import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReportFilters } from "../report-filters";
import { ReportPrintButton } from "../report-print-button";
import { ReportExportButtons, type ReportProjectExport } from "../report-export-buttons";

const CATEGORY_LABELS: Record<string, string> = {
  MATERIAL: "Materials",
  LABOR: "Labor",
  EQUIPMENT: "Equipment",
  SUBCONTRACT: "Subcontract",
  OTHER: "Other",
};

function parseMonthRange(from: string | null, to: string | null): { start: Date; end: Date; label: string } {
  const now = new Date();
  const fromMonth = from?.match(/^(\d{4})-(\d{2})$/);
  const toMonth = to?.match(/^(\d{4})-(\d{2})$/);
  let start: Date;
  let end: Date;
  if (fromMonth && toMonth) {
    start = new Date(parseInt(fromMonth[1], 10), parseInt(fromMonth[2], 10) - 1, 1, 0, 0, 0, 0);
    end = new Date(parseInt(toMonth[1], 10), parseInt(toMonth[2], 10), 0, 23, 59, 59, 999);
  } else {
    // Default: current year Jan → current month
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  const startLabel = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const label = startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
  return { start, end, label };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function FinancialReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; projectId?: string; clientId?: string; category?: string; materialId?: string; companyId?: string }>;
}) {
  const params = await searchParams;
  const from = params.from ?? null;
  const to = params.to ?? null;
  const projectIdParam = params.projectId ?? null;
  const clientIdParam = params.clientId ?? null;
  const categoryParam = params.category ?? null;
  const materialIdParam = params.materialId ?? null;
  const companyIdParam = params.companyId ?? null;

  const { start: rangeStart, end: rangeEnd, label: periodLabel } = parseMonthRange(from, to);

  const projectWhere = {
    deletedAt: null,
    ...(clientIdParam ? { clientId: clientIdParam } : {}),
    ...(projectIdParam ? { id: projectIdParam } : {}),
    ...(companyIdParam ? { companyId: companyIdParam } : {}),
  };

  const [projectsMatchingFilters, allProjectsForFilters, clients, materials, companies] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: { id: true, name: true, clientId: true, budget: true, status: true, startDate: true, endDate: true, client: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.materialCatalog.findMany({
      where: {},
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      where: {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const projectIds = projectsMatchingFilters.map((p: any) => p.id);
  const categoriesFromMaterials = Array.from(new Set(materials.map((m: any) => m.category).filter(Boolean))) as string[];
  categoriesFromMaterials.sort();

  const materialNameForFilter = materialIdParam ? materials.find((m: any) => m.id === materialIdParam)?.name ?? null : null;

  const itemConditions = materialNameForFilter
    ? { some: { materials: materialNameForFilter } }
    : undefined;

  const expenseWhere = {
    deletedAt: null,
    projectId: { in: projectIds },
    expenseDate: { gte: rangeStart, lte: rangeEnd },
    ...(categoryParam ? { category: categoryParam as "MATERIAL" | "LABOR" | "EQUIPMENT" | "SUBCONTRACT" | "OTHER" } : {}),
    ...(itemConditions ? { items: itemConditions } : {}),
    ...(companyIdParam ? { companyId: companyIdParam } : {}),
  };

  const [expensesForProjects, depositsForProjects] = await Promise.all([
    projectIds.length > 0
      ? prisma.expense.findMany({
          where: expenseWhere,
          orderBy: [{ projectId: "asc" }, { expenseDate: "asc" }],
          include: { items: true },
        })
      : [],
    projectIds.length > 0
      ? prisma.projectDeposit.findMany({
          where: {
            projectId: { in: projectIds },
            paidAt: { gte: rangeStart, lte: rangeEnd },
          },
        })
      : [],
  ]);

  const depositsByProject = new Map<string, number>();
  for (const d of depositsForProjects) {
    depositsByProject.set(d.projectId, (depositsByProject.get(d.projectId) ?? 0) + Number(d.amount));
  }

  type ExpenseRow = { date: string; material: string; qty: number; unitPrice: number; amount: number };
  type ReportProject = {
    id: string;
    name: string;
    clientName: string | null;
    budget: number;
    received: number;
    status: string;
    startEnd: string;
    expenses: ExpenseRow[];
    totalExpenses: number;
  };

  const reportProjects: ReportProject[] = projectsMatchingFilters.map((proj: any) => {
    const projectExpenses = expensesForProjects.filter((e: any) => e.projectId === proj.id);
    const expenseRows: ExpenseRow[] = [];
    for (const exp of projectExpenses) {
      if (exp.items.length > 0) {
        for (const item of exp.items) {
          const qty = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);
          const amount = qty * unitPrice;
          expenseRows.push({
            date: formatDate(exp.expenseDate),
            material: item.materials,
            qty,
            unitPrice,
            amount,
          });
        }
      } else {
        expenseRows.push({
          date: formatDate(exp.expenseDate),
          material: exp.title,
          qty: Number(exp.quantity ?? 1),
          unitPrice: Number(exp.unitCost ?? exp.amount),
          amount: Number(exp.amount),
        });
      }
    }
    expenseRows.sort((a, b) => a.date.localeCompare(b.date));
    const totalExpenses = expenseRows.reduce((sum, r) => sum + r.amount, 0);
    const received = depositsByProject.get(proj.id) ?? 0;
    const startEnd = [
      proj.startDate ? formatDate(proj.startDate) : "",
      proj.endDate ? formatDate(proj.endDate) : "",
    ].filter(Boolean).join(" – ") || "—";
    return {
      id: proj.id,
      name: proj.name,
      clientName: proj.client?.name ?? null,
      budget: Number(proj.budget),
      received,
      status: STATUS_LABELS[proj.status] ?? proj.status,
      startEnd,
      expenses: expenseRows,
      totalExpenses,
    };
  });

  const reportDataForExport: ReportProjectExport[] = reportProjects.map((p) => ({
    name: p.name,
    clientName: p.clientName,
    budget: p.budget,
    received: p.received,
    status: p.status,
    startEnd: p.startEnd,
    expenses: p.expenses,
    totalExpenses: p.totalExpenses,
  }));

  const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const totalExpensesAll = reportProjects.reduce((s, p) => s + p.totalExpenses, 0);
  const totalReceivedAll = reportProjects.reduce((s, p) => s + p.received, 0);
  const totalBudgetAll = reportProjects.reduce((s, p) => s + p.budget, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/reports" className="text-sm font-medium text-teal-600 hover:text-teal-700 print:hidden">← Reports</Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Financial Overview</h1>
          <p className="text-sm text-slate-500">Period: {periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <ReportPrintButton />
          <ReportExportButtons reportData={reportDataForExport} periodLabel={periodLabel} generatedAt={generatedAt} />
        </div>
      </div>

      <ReportFilters
        basePath="/reports/financial"
        projects={allProjectsForFilters.map((p: any) => ({ id: p.id, name: p.name, clientId: p.clientId }))}
        clients={clients.map((c: any) => ({ id: c.id, name: c.name }))}
        companies={companies}
        categories={categoriesFromMaterials}
        materials={materials.map((m: any) => ({ id: m.id, name: m.name, category: m.category }))}
        showCategoryMaterial={true}
      />

      {/* KPI summary cards */}
      {reportProjects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Projects</p>
            <p className="text-2xl font-black text-slate-900">{reportProjects.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Budget</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalBudgetAll)}</p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Total Expenses</p>
            <p className="text-2xl font-black text-red-700">{formatCurrency(totalExpensesAll)}</p>
          </div>
          <div className={`rounded-2xl border p-5 shadow-sm ${totalBudgetAll - totalExpensesAll >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${totalBudgetAll - totalExpensesAll >= 0 ? "text-emerald-600" : "text-red-600"}`}>Variance</p>
            <p className={`text-2xl font-black ${totalBudgetAll - totalExpensesAll >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(totalBudgetAll - totalExpensesAll)}</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {reportProjects.map((proj) => (
          <section
            key={proj.id}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden print:shadow-none print:rounded-none"
          >
            <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 3 }} />
            <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">{proj.name}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {proj.clientName ?? "No client"} · {proj.status}
                    {proj.startEnd !== "—" ? ` · ${proj.startEnd}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-sm">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget</p>
                    <p className="font-black text-slate-900">{formatCurrency(proj.budget)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expenses</p>
                    <p className="font-black text-red-600">{formatCurrency(proj.totalExpenses)}</p>
                  </div>
                  <div className={`text-right px-3 py-1.5 rounded-lg ${proj.budget - proj.totalExpenses >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${proj.budget - proj.totalExpenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>Variance</p>
                    <p className={`font-black ${proj.budget - proj.totalExpenses >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatCurrency(proj.budget - proj.totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr style={{ background: "#0d9488" }}>
                    <th style={{ color: "#fff", padding: "8px 20px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Date</th>
                    <th style={{ color: "#fff", padding: "8px 20px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Line item</th>
                    <th style={{ color: "#fff", padding: "8px 20px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "right" }}>Qty</th>
                    <th style={{ color: "#fff", padding: "8px 20px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "right" }}>Unit price</th>
                    <th style={{ color: "#fff", padding: "8px 20px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {proj.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">
                        No expenses recorded in this period
                      </td>
                    </tr>
                  ) : (
                    proj.expenses.map((row, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }} className="hover:bg-teal-50/30">
                        <td className="px-5 py-2.5 text-slate-600 whitespace-nowrap text-xs">{row.date}</td>
                        <td className="px-5 py-2.5 text-slate-800">{row.material}</td>
                        <td className="px-5 py-2.5 text-right text-slate-600 tabular-nums">{row.qty}</td>
                        <td className="px-5 py-2.5 text-right text-slate-600 tabular-nums">{formatCurrency(row.unitPrice)}</td>
                        <td className="px-5 py-2.5 text-right font-semibold text-slate-900 tabular-nums">{formatCurrency(row.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100">
                    <td colSpan={4} className="border-t border-slate-200 px-5 py-3 font-black text-slate-800 uppercase text-xs tracking-wide">
                      Total Expenses
                    </td>
                    <td className="border-t border-slate-200 px-5 py-3 text-right font-black text-slate-900 tabular-nums">
                      {formatCurrency(proj.totalExpenses)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        ))}
      </div>

      {reportProjects.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-slate-50/50 px-6 py-12 text-center text-slate-500">
          No projects match the selected filters. Adjust from/to, client, project, category, or material and generate the report.
        </p>
      )}
    </div>
  );
}
