import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "../expense-form";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const [projects, materials, companies] = await Promise.all([
    prisma.project.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.materialCatalog.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, category: true },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="page-title">Add expense</h1>
      <p className="page-subtitle">Record materials, labor, or other costs for a project</p>
      <ExpenseForm
        projects={projects}
        materials={materials}
        companies={companies}
        defaultProjectId={projectId ?? undefined}
      />
    </div>
  );
}
