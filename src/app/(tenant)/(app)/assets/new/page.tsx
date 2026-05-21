import { prisma } from "@/lib/prisma";
import { AssetForm } from "../asset-form";

export default async function NewAssetPage() {
  const companies = await prisma.company.findMany({
    where: {},
    select: { id: true, name: true, isDefault: true },
  });

  return (
    <div className="space-y-6 text-center max-w-2xl mx-auto">
      <h1 className="page-title">Add asset</h1>
      <p className="page-subtitle">Record fixed or current assets for the balance sheet</p>
      <AssetForm companies={companies} />
    </div>
  );
}
