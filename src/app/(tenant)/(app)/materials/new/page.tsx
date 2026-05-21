import { prisma } from "@/lib/prisma";
import { MaterialForm } from "../material-form";

export default async function NewMaterialPage() {
  const rows = await prisma.materialCatalog.findMany({
    where: { category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  const categories = rows.map((r) => r.category).filter((c): c is string => c != null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Add material to catalog</h1>
      <MaterialForm initialCategories={categories} />
    </div>
  );
}
