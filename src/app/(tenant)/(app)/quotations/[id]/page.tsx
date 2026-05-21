import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/organization-context";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { computeQuotationTotal } from "../quotation-math";
import { deleteQuotation, convertQuotationToInvoice } from "../actions";
import { PrintButton } from "./print-button";

function getStatusColor(status: string) {
  switch (status) {
    case "ACCEPTED": return "bg-green-100 text-green-700 border-green-200";
    case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
    case "SENT":     return "bg-blue-100 text-blue-700 border-blue-200";
    case "EXPIRED":  return "bg-orange-100 text-orange-700 border-orange-200";
    default:         return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

async function handleConvert(quotationId: string) {
  "use server";
  const result = await convertQuotationToInvoice(quotationId);
  if (result.invoiceId) redirect(`/invoices/${result.invoiceId}`);
}

async function handleDelete(quotationId: string) {
  "use server";
  await deleteQuotation(quotationId);
  redirect("/quotations");
}

export default async function QuotationDetailPage({ params }: { params: { id: string } }) {
  const org = await getOrganization();

  const quotation = await prisma.quotation.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      project: { include: { client: true } },
      company: true,
      items: true,
    },
  });

  if (!quotation) notFound();

  const subtotal = quotation.items.reduce((s, i) => s + Number(i.amount), 0);
  const discount = Number(quotation.discount || 0);
  const total = computeQuotationTotal(quotation);

  const fc = (v: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const isExpired = new Date(quotation.validUntil) < new Date() && quotation.status !== "ACCEPTED";
  const canConvert = !quotation.convertedToInvoiceId && quotation.status !== "REJECTED";

  const companyName    = quotation.company?.name    || org.name;
  const companyAddress = quotation.company?.address || "";
  const companyPhone   = quotation.company?.phone   || "";
  const companyEmail   = quotation.company?.email   || "";
  const companyWebsite = quotation.company?.website || "";
  const companyTaxId   = quotation.company?.taxId   || "";
  const companyLogoUrl = quotation.company?.logoUrl  || org.logoUrl || "";
  const orgBusinessInfo = org.businessInfo || "";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-8 print:hidden">
        <div>
          <Link href="/quotations" className="group inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1"><path d="m15 18-6-6 6-6" /></svg>
            Back to Quotations
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 font-display uppercase tracking-tight">
              {quotation.quotationNumber || "QUO-TEMP"}
            </h1>
            <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black border uppercase tracking-[0.2em] ${getStatusColor(quotation.status)}`}>
              {quotation.status}
            </span>
            {isExpired && quotation.status === "SENT" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-[0.2em] bg-orange-100 text-orange-700 border-orange-200">
                Expired
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {quotation.convertedToInvoiceId && (
            <Link href={`/invoices/${quotation.convertedToInvoiceId}`} className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100">
              View Invoice →
            </Link>
          )}
          {canConvert && (
            <form action={handleConvert.bind(null, quotation.id)}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                Convert to Invoice
              </button>
            </form>
          )}
          <Link href={`/quotations/${quotation.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Edit
          </Link>
          <PrintButton />
          <form action={handleDelete.bind(null, quotation.id)}>
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PRINT DOCUMENT
      ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden mx-auto max-w-5xl print:!border-0 print:!shadow-none print:!rounded-none print:!max-w-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; }
            @page { margin: 1cm 1.5cm; size: A4; }
          }
        `}} />

        <div className="print-area font-sans text-slate-800">

          {/* ── Top accent bar ── */}
          <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 8 }} />

          {/* ── Company letterhead ── */}
          <div className="px-12 pt-8 pb-6 flex items-start justify-between gap-8 border-b border-slate-200">
            <div className="flex items-center gap-5">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={companyName} className="h-16 w-auto max-w-[140px] object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div style={{ width: 64, height: 64, background: "#0d9488", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>{companyName.slice(0, 1).toUpperCase()}</span>
                </div>
              )}
              <div>
                <div className="text-xl font-black text-slate-900 tracking-tight leading-tight">{companyName}</div>
                {orgBusinessInfo && <div className="text-xs text-slate-500 mt-0.5 max-w-xs leading-snug">{orgBusinessInfo}</div>}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-0.5 min-w-[180px]">
              {companyAddress && <div className="leading-snug whitespace-pre-wrap">{companyAddress}</div>}
              {companyPhone   && <div>📞 {companyPhone}</div>}
              {companyEmail   && <div>✉ {companyEmail}</div>}
              {companyWebsite && <div>🌐 {companyWebsite}</div>}
              {companyTaxId   && <div className="mt-1 font-semibold text-slate-600">Tax ID: {companyTaxId}</div>}
            </div>
          </div>

          {/* ── Document title + meta ── */}
          <div className="px-12 py-7 flex items-end justify-between gap-8 border-b border-slate-100">
            <div>
              <div className="text-5xl font-black tracking-tight uppercase leading-none" style={{ color: "#0d9488" }}>Quotation</div>
              {quotation.project && (
                <div className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Project: {quotation.project.name}
                </div>
              )}
            </div>
            <div className="text-right space-y-1 text-sm">
              <div className="flex justify-end gap-6">
                <span className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Quotation No</span>
                <span className="font-black text-slate-900 font-mono">{quotation.quotationNumber || "—"}</span>
              </div>
              <div className="flex justify-end gap-6">
                <span className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Date</span>
                <span className="text-slate-700 font-medium">{format(quotation.issueDate, "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-end gap-6">
                <span className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Valid Until</span>
                <span className="text-slate-700 font-medium">{format(quotation.validUntil, "dd MMM yyyy")}</span>
              </div>
              <div className="pt-1">
                <span className={`inline-block px-3 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(quotation.status)}`}>
                  {quotation.status}
                </span>
              </div>
            </div>
          </div>

          {/* ── Parties ── */}
          <div className="px-12 py-7 grid grid-cols-2 gap-12 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Prepared For</div>
              <div className="text-base font-black text-slate-900 leading-tight">
                {quotation.recipientName || (quotation.project?.client as any)?.name || "Client"}
              </div>
              {(quotation.recipientAddress || (quotation.project?.client as any)?.address) && (
                <div className="mt-1 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                  {quotation.recipientAddress || (quotation.project?.client as any)?.address}
                </div>
              )}
              {(quotation.project?.client as any)?.email && (
                <div className="mt-1 text-xs text-slate-500">{(quotation.project?.client as any).email}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Prepared By</div>
              <div className="text-base font-black text-slate-900 leading-tight">{companyName}</div>
              {companyAddress && <div className="mt-1 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{companyAddress}</div>}
              {companyPhone   && <div className="mt-1 text-xs text-slate-500">{companyPhone}</div>}
              {companyEmail   && <div className="text-xs text-slate-500">{companyEmail}</div>}
            </div>
          </div>

          {/* ── Line items table ── */}
          <div className="px-12 pt-7">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#0d9488" }}>
                  <th style={{ textAlign: "left",   color: "#fff", padding: "10px 14px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</th>
                  <th style={{ textAlign: "center", color: "#fff", padding: "10px 14px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", width: 70 }}>Qty</th>
                  <th style={{ textAlign: "right",  color: "#fff", padding: "10px 14px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", width: 110 }}>Unit Price</th>
                  <th style={{ textAlign: "right",  color: "#fff", padding: "10px 14px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", width: 120 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", color: "#1e293b" }}>{item.description}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", textAlign: "center", color: "#475569" }}>{Number(item.quantity).toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#475569" }}>${fc(Number(item.unitPrice))}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: 600, color: "#1e293b" }}>${fc(Number(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals ── */}
          <div className="px-12 py-4 flex justify-end">
            <div style={{ minWidth: 280 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", fontSize: 13, color: "#64748b" }}>
                <span>Subtotal</span><span>${fc(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", fontSize: 13, color: "#ef4444" }}>
                  <span>Discount</span><span>− ${fc(discount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#0d9488", color: "#fff", fontWeight: 900, fontSize: 15, marginTop: 4, borderRadius: 4 }}>
                <span>TOTAL</span><span>${fc(total)}</span>
              </div>
            </div>
          </div>

          {/* ── Notes / Terms ── */}
          {(quotation.notes || quotation.terms || quotation.company?.notes) && (
            <div className="px-12 py-6 border-t border-slate-100 grid gap-6" style={{ gridTemplateColumns: quotation.notes && (quotation.terms || quotation.company?.notes) ? "1fr 1fr" : "1fr" }}>
              {quotation.notes && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Notes</div>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{quotation.notes}</div>
                </div>
              )}
              {(quotation.terms || quotation.company?.notes) && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Terms & Conditions</div>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{quotation.terms || quotation.company?.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-12 py-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs italic text-slate-400">This quotation is valid until {format(quotation.validUntil, "dd MMMM, yyyy")}.</p>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-600">{companyName}</p>
              {companyWebsite && <p className="text-[10px] text-slate-400">{companyWebsite}</p>}
            </div>
          </div>
          <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 6 }} />

        </div>
      </div>

      {/* ── Screen-only summary ── */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Prepared For</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight">
              {quotation.recipientName || (quotation.project?.client as any)?.name || "Client"}
            </h3>
            <p className="text-sm text-slate-500 whitespace-pre-wrap leading-relaxed max-w-sm mt-1">
              {quotation.recipientAddress || (quotation.project?.client as any)?.address || ""}
            </p>
          </div>
          {quotation.project && (
            <div className="pt-6 border-t border-slate-100 max-w-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Project Reference</p>
              <h3 className="text-base font-black text-teal-600 uppercase tracking-tight leading-tight">{quotation.project.name}</h3>
            </div>
          )}
        </div>
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center text-sm font-medium text-slate-500 px-2"><span>Subtotal</span><span>${fc(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between items-center text-sm font-medium text-red-500 px-2"><span>Discount</span><span>-${fc(discount)}</span></div>}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-end px-2">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Amount</p>
              <div className="text-4xl font-black text-slate-900 font-display">${fc(total)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
