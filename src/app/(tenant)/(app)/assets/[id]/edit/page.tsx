import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AssetForm } from "../../asset-form";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [asset, companies] = await Promise.all([
    prisma.asset.findFirst({
      where: { id },
    }),
    prisma.company.findMany({
      where: {},
      select: { id: true, name: true, isDefault: true },
    }),
  ]);
  if (!asset) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Edit asset</h1>
        <Link href="/assets" className="btn btn-secondary">
          ← Back to assets
        </Link>
      </div>
      <AssetForm asset={asset} companies={companies} />
    </div>
  );
}
