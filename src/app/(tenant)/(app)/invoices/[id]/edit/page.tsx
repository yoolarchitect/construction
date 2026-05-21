import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InvoiceForm } from "../../invoice-form";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const [invoice, projects, companies] = await Promise.all([
    prisma.invoice.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    }),
    prisma.project.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        installments: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.company.findMany({
      where: {},
      select: { id: true, name: true, logoUrl: true, isDefault: true },
      orderBy: { name: 'asc' }
    }),
  ]);

  if (!invoice) notFound();

  // Convert dates and decimals for the client component
  const localizedInvoice = {
    ...invoice,
    issueDate: new Date(invoice.issueDate),
    dueDate: new Date(invoice.dueDate),
    discount: Number(invoice.discount),
    notes: invoice.notes ?? null,
    items: invoice.items.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
  };

  const localizedProjects = projects.map((p: any) => ({
    ...p,
    budget: Number(p.budget),
    installments: p.installments.map((i: any) => ({
      ...i,
      amount: Number(i.amount)
    }))
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display transition-all">Edit Invoice: {invoice.invoiceNumber}</h1>
        <p className="text-sm text-slate-500">Update the details and line items for this invoice.</p>
      </div>

      <InvoiceForm 
        projects={localizedProjects} 
        companies={companies} 
        invoice={localizedInvoice as any} 
      />
    </div>
  );
}
