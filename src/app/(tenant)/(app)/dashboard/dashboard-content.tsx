import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ExpensesByMonthChart,
  ExpensesByCategoryChart,
  SpentVsReceivedChart,
  type ExpensesByMonth,
  type ExpensesByCategory,
  type SpentVsReceived,
} from "./dashboard-charts";

const PROJECTS_SHOWN = 8;
const RECENT_EXPENSES_SHOWN = 10;
const CHART_MONTHS = 6;

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PLANNING: { bg: "bg-slate-100", text: "text-slate-700" },
  ACTIVE: { bg: "bg-emerald-100", text: "text-emerald-800" },
  ON_HOLD: { bg: "bg-amber-100", text: "text-amber-800" },
  COMPLETED: { bg: "bg-blue-100", text: "text-blue-800" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function DashboardContent() {
  const baseWhere = { deletedAt: null };

  const [
    projectCount,
    clientCount,
    expenseAgg,
    expenseCount,
    depositAgg,
    totalBudgetAgg,
    projectsWithClient,
    expenseByProject,
    depositByProject,
    recentExpenses,
    expensesLastMonths,
    expenseByCategoryGroup,
  ] = await Promise.all([
    prisma.project.count({ where: baseWhere }),
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.expense.aggregate({
      where: { ...baseWhere, project: { deletedAt: null } },
      _sum: { amount: true },
    }),
    prisma.expense.count({
      where: { ...baseWhere, project: { deletedAt: null } },
    }),
    prisma.projectDeposit.aggregate({
      where: { project: { deletedAt: null } },
      _sum: { amount: true },
    }),
    prisma.project.aggregate({
      where: baseWhere,
      _sum: { budget: true },
    }),
    prisma.project.findMany({
      where: baseWhere,
      take: PROJECTS_SHOWN,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        startDate: true,
        endDate: true,
        client: { select: { name: true } },
      },
    }),
    prisma.expense.groupBy({
      by: ["projectId"],
      where: { ...baseWhere, project: { deletedAt: null } },
      _sum: { amount: true },
    }),
    prisma.projectDeposit.groupBy({
      by: ["projectId"],
      where: { project: { deletedAt: null } },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { ...baseWhere, project: { deletedAt: null } },
      take: RECENT_EXPENSES_SHOWN,
      orderBy: { expenseDate: "desc" },
      select: {
        id: true,
        title: true,
        amount: true,
        expenseDate: true,
        category: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.findMany({
      where: {
        ...baseWhere,
        project: { deletedAt: null },
        expenseDate: {
          gte: (() => {
            const d = new Date();
            d.setMonth(d.getMonth() - CHART_MONTHS);
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
        },
      },
      select: { expenseDate: true, amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { ...baseWhere, project: { deletedAt: null } },
      _sum: { amount: true },
    }),
  ]);

  const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
  const totalDeposits = Number(depositAgg._sum.amount ?? 0);
  const totalBudget = Number(totalBudgetAgg._sum.budget ?? 0);
  const expenseMap = new Map(expenseByProject.map((e) => [e.projectId, Number(e._sum.amount ?? 0)]));
  const depositMap = new Map(depositByProject.map((d) => [d.projectId, Number(d._sum.amount ?? 0)]));

  // Chart: expenses by month (last N months)
  const monthKeys: string[] = [];
  for (let i = CHART_MONTHS - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const byMonth = new Map<string, number>();
  monthKeys.forEach((k) => byMonth.set(k, 0));
  for (const e of expensesLastMonths) {
    const d = new Date(e.expenseDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) ?? 0) + Number(e.amount));
  }
  const expensesByMonthData: ExpensesByMonth = monthKeys.map((key) => {
    const [y, m] = key.split("-").map(Number);
    const date = new Date(y, m - 1, 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { month: key, amount: byMonth.get(key) ?? 0, label };
  });

  const expensesByCategoryData: ExpensesByCategory = expenseByCategoryGroup
    .map((row) => ({
      category: row.category,
      amount: Number(row._sum.amount ?? 0),
      name: row.category.replace("_", " "),
    }))
    .filter((row) => row.amount > 0);

  const spentVsReceivedData: SpentVsReceived = {
    totalSpent: totalExpenses,
    totalReceived: totalDeposits,
  };

  const kpis = [
    {
      label: "Projects",
      value: projectCount,
      href: "/projects",
      icon: ProjectsIcon,
      color: "bg-teal-500/10 text-teal-600",
      borderColor: "border-teal-200",
    },
    {
      label: "Clients",
      value: clientCount,
      href: "/clients",
      icon: ClientsIcon,
      color: "bg-indigo-500/10 text-indigo-600",
      borderColor: "border-indigo-200",
    },
    {
      label: "Total spent",
      value: formatCurrency(totalExpenses),
      href: "/expenses",
      icon: ExpenseIcon,
      color: "bg-amber-500/10 text-amber-700",
      borderColor: "border-amber-200",
    },
    {
      label: "Total received",
      value: formatCurrency(totalDeposits),
      href: "/reports",
      icon: ReceivedIcon,
      color: "bg-emerald-500/10 text-emerald-700",
      borderColor: "border-emerald-200",
    },
    {
      label: "Expense records",
      value: expenseCount,
      href: "/expenses",
      icon: RecordsIcon,
      color: "bg-violet-500/10 text-violet-600",
      borderColor: "border-violet-200",
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/30 px-6 py-8 shadow-sm">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
            Overview of projects, finances, and recent activity. Total budget across projects: {formatCurrency(totalBudget)}.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`group relative rounded-2xl border ${kpi.borderColor} bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300`}
          >
            <div className={`inline-flex rounded-xl p-2.5 ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {kpi.value}
            </p>
            <span className="mt-2 inline-block text-xs font-medium text-slate-400 group-hover:text-teal-600">
              View →
            </span>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Expenses over time (last 6 months)</h2>
          <ExpensesByMonthChart data={expensesByMonthData} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">Expenses by category</h2>
          <ExpensesByCategoryChart data={expensesByCategoryData} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Spent vs received</h2>
        <SpentVsReceivedChart data={spentVsReceivedData} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Projects overview — 2/3 width */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Projects overview</h2>
                <Link
                  href="/projects"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  All projects →
                </Link>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {projectsWithClient.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-500">
                  No projects yet. <Link href="/projects/new" className="font-medium text-teal-600 hover:underline">Create one</Link>.
                </div>
              ) : (
                projectsWithClient.map((p) => {
                  const spent = expenseMap.get(p.id) ?? 0;
                  const received = depositMap.get(p.id) ?? 0;
                  const budget = Number(p.budget);
                  const statusStyle = STATUS_STYLES[p.status] ?? STATUS_STYLES.PLANNING;
                  const overBudget = budget > 0 && spent > budget;
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50 sm:flex-nowrap"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.client?.name ?? "No client"}</p>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {p.status.replace("_", " ")}
                      </span>
                      <div className="flex shrink-0 flex-wrap items-center gap-4 text-sm">
                        <span className="text-slate-600" title="Budget">
                          {formatCurrency(budget)}
                        </span>
                        <span className={spent > 0 ? "text-slate-800 font-medium" : "text-slate-400"} title="Spent">
                          {formatCurrency(spent)}
                        </span>
                        <span className="text-emerald-600 font-medium" title="Received">
                          {formatCurrency(received)}
                        </span>
                        {overBudget && (
                          <span className="text-xs font-medium text-amber-600" title="Over budget">
                            Over
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-teal-600 text-sm font-medium">View →</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent expenses — 1/3 width */}
        <div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">Recent expenses</h2>
                <Link
                  href="/expenses"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700"
                >
                  All expenses →
                </Link>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {recentExpenses.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-slate-500">
                  No expenses yet. <Link href="/expenses/new" className="font-medium text-teal-600 hover:underline">Add one</Link>.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentExpenses.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/projects/${e.project.id}`}
                        className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-slate-50/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{e.title}</p>
                          <p className="text-xs text-slate-500">
                            {e.project.name} · {formatDate(e.expenseDate)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-slate-800">
                          {formatCurrency(Number(e.amount))}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function ClientsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ExpenseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ReceivedIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
      <path d="M5 12h14" />
    </svg>
  );
}

function RecordsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}
