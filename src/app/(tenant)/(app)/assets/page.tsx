import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

const CATEGORY_LABEL: Record<string, string> = {
  FIXED: "Fixed",
  CURRENT: "Current",
};

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const current = Math.max(1, parseInt(page, 10) || 1);
  const skip = (current - 1) * PAGE_SIZE;

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where: {},
      take: PAGE_SIZE,
      skip,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.asset.count({ where: {} }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Assets</h1>
          <p className="page-subtitle">Fixed and current assets for the balance sheet</p>
        </div>
        <Link href="/assets/new" className="btn btn-primary shrink-0">
          Add asset
        </Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th className="text-right">Cost</th>
              <th className="w-0"></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-slate-800">{a.name}</td>
                <td className="text-slate-600">{CATEGORY_LABEL[a.category] ?? a.category}</td>
                <td className="text-right tabular-nums text-slate-800">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 2,
                  }).format(Number(a.cost))}
                </td>
                <td className="text-right">
                  <Link
                    href={`/assets/${a.id}/edit`}
                    className="text-sm font-medium text-teal-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={4} className="text-slate-500">
                  No assets yet. Add one to include it on the balance sheet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2">
          {current > 1 && (
            <Link href={`/assets?page=${current - 1}`} className="btn btn-secondary">
              Previous
            </Link>
          )}
          <span className="py-2 text-sm text-slate-600">
            Page {current} of {totalPages}
          </span>
          {current < totalPages && (
            <Link href={`/assets?page=${current + 1}`} className="btn btn-secondary">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
