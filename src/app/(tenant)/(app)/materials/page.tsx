import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const current = Math.max(1, parseInt(page, 10) || 1);
  const skip = (current - 1) * PAGE_SIZE;

  const [materials, total] = await Promise.all([
    prisma.materialCatalog.findMany({
      where: {},
      take: PAGE_SIZE,
      skip,
      orderBy: { name: "asc" },
    }),
    prisma.materialCatalog.count({ where: {} }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Materials catalog</h1>
          <p className="page-subtitle">Materials and units for procurement and BOQ</p>
        </div>
        <Link href="/materials/new" className="btn btn-primary shrink-0">
          Add material
        </Link>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m: any) => (
              <tr key={m.id}>
                <td className="font-medium text-slate-800">{m.name}</td>
                <td className="text-slate-600">{m.category || "—"}</td>
                <td className="text-slate-600">{m.unit}</td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={3} className="text-slate-500">
                  No materials in catalog. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2">
          {current > 1 && (
            <Link href={`/materials?page=${current - 1}`} className="btn btn-secondary">
              Previous
            </Link>
          )}
          <span className="py-2 text-sm text-slate-600">
            Page {current} of {totalPages}
          </span>
          {current < totalPages && (
            <Link href={`/materials?page=${current + 1}`} className="btn btn-secondary">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
