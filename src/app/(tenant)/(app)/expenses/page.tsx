import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  MATERIAL: { bg: "bg-amber-100", text: "text-amber-800" },
  LABOR: { bg: "bg-blue-100", text: "text-blue-800" },
  EQUIPMENT: { bg: "bg-slate-100", text: "text-slate-800" },
  SUBCONTRACT: { bg: "bg-violet-100", text: "text-violet-800" },
  OTHER: { bg: "bg-slate-100", text: "text-slate-600" },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function AddExpenseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ExpenseTotalIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const current = Math.max(1, parseInt(page, 10) || 1);
  const skip = (current - 1) * PAGE_SIZE;

  const baseWhere = {
    deletedAt: null,
    project: { deletedAt: null },
  };

  const [expenses, total, aggregate] = await Promise.all([
    prisma.expense.findMany({
      where: baseWhere,
      take: PAGE_SIZE,
      skip,
      orderBy: { expenseDate: "desc" },
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.expense.count({ where: baseWhere }),
    prisma.expense.aggregate({
      where: baseWhere,
      _sum: { amount: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalAmount = Number(aggregate._sum.amount ?? 0);

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 px-6 py-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Expenses
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Labor, materials, equipment, and other costs by project
            </p>
          </div>
          <Link
            href="/expenses/new"
            className="btn btn-primary inline-flex shrink-0 items-center gap-2"
          >
            <AddExpenseIcon className="h-4 w-4" />
            Add expense
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-amber-500/10 p-2.5 text-amber-700">
            <ExpenseTotalIcon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Total expenses
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex rounded-xl bg-slate-500/10 p-2.5 text-slate-600">
            <RecordsIcon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
            Records
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {total}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Expense list</h2>
            <Link href="/expenses/new" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              Add expense →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="border border-slate-200 px-5 py-3.5 font-semibold text-slate-700">Title</th>
                <th className="border border-slate-200 px-5 py-3.5 font-semibold text-slate-700">Category</th>
                <th className="border border-slate-200 px-5 py-3.5 font-semibold text-slate-700">Project</th>
                <th className="border border-slate-200 px-5 py-3.5 font-semibold text-slate-700 text-right">Date</th>
                <th className="border border-slate-200 px-5 py-3.5 font-semibold text-slate-700 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-slate-200 px-6 py-12 text-center">
                    <p className="text-slate-500">No expenses yet</p>
                    <Link
                      href="/expenses/new"
                      className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      Add your first expense
                    </Link>
                  </td>
                </tr>
              ) : (
                expenses.map((e) => {
                  const catStyle = CATEGORY_STYLES[e.category] ?? CATEGORY_STYLES.OTHER;
                  return (
                    <tr key={e.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="border border-slate-200 px-5 py-3 font-medium text-slate-800">
                        {e.title}
                      </td>
                      <td className="border border-slate-200 px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${catStyle.bg} ${catStyle.text}`}>
                          {e.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="border border-slate-200 px-5 py-3">
                        <Link
                          href={`/projects/${e.project.id}`}
                          className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          {e.project.name}
                        </Link>
                      </td>
                      <td className="border border-slate-200 px-5 py-3 text-right text-slate-600 whitespace-nowrap">
                        {formatDate(e.expenseDate)}
                      </td>
                      <td className="border border-slate-200 px-5 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(Number(e.amount))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/30 px-6 py-4">
            <p className="text-sm text-slate-600">
              Page {current} of {totalPages}
              {total > 0 && (
                <span className="ml-1 text-slate-400">
                  ({total} record{total !== 1 ? "s" : ""})
                </span>
              )}
            </p>
            <div className="flex gap-2">
              {current > 1 && (
                <Link
                  href={current === 2 ? "/expenses" : `/expenses?page=${current - 1}`}
                  className="btn btn-secondary text-sm"
                >
                  Previous
                </Link>
              )}
              {current < totalPages && (
                <Link href={`/expenses?page=${current + 1}`} className="btn btn-secondary text-sm">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
