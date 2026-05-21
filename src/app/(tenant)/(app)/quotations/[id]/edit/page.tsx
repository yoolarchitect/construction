import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuotationForm } from "../../quotation-form";

export default async function EditQuotationPage({ params }: { params: { id: string } }) {
  const [quotation, projects, companies] = await Promise.all([
    prisma.quotation.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { items: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true, logoUrl: true, isDefault: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!quotation) notFound();

  const localized = {
    ...quotation,
    issueDate: new Date(quotation.issueDate),
    validUntil: new Date(quotation.validUntil),
    discount: Number(quotation.discount),
    notes: quotation.notes ?? null,
    items: quotation.items.map((it) => ({
      ...it,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      amount: Number(it.amount),
    })),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display">Edit Quotation: {quotation.quotationNumber}</h1>
        <p className="text-sm text-slate-500">Update the details and line items for this quotation.</p>
      </div>
      <QuotationForm projects={projects} companies={companies} quotation={localized as any} />
    </div>
  );
}
