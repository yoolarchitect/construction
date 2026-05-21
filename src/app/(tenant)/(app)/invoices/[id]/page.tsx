import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/organization-context";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { computeInvoiceGrandTotal } from "../invoice-math";
import { updateInvoiceStatus, quickMarkInvoicePaid } from "../actions";
import { PrintButton } from "./print-button";
import { InvoicePaymentsSection } from "./invoice-payments-section";

async function handleSendInvoice(invoiceId: string) {
  "use server";
  await updateInvoiceStatus(invoiceId, "SENT");
}

async function handleMarkOverdue(invoiceId: string) {
  "use server";
  await updateInvoiceStatus(invoiceId, "OVERDUE");
}

async function handleQuickMarkPaid(invoiceId: string) {
  "use server";
  await quickMarkInvoicePaid(invoiceId);
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const org = await getOrganization();

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      project: { include: { client: true } },
      company: true,
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!invoice) notFound();

  const subtotal = (invoice.items || []).reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const discount = Number(invoice.discount || 0);
  const total = computeInvoiceGrandTotal(invoice);
  const paidTotal = (invoice.payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const remaining = Math.max(0, total - paidTotal);

  const getStatusColor = (s: string) => {
    switch (s) {
      case "PAID":    return "bg-green-100 text-green-700 border-green-200";
      case "OVERDUE": return "bg-red-100 text-red-700 border-red-200";
      case "SENT":    return "bg-blue-100 text-blue-700 border-blue-200";
      case "PARTIAL": return "bg-amber-100 text-amber-700 border-amber-200";
      default:        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const fc = (v: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  const companyName    = invoice.company?.name    || org.name;
  const companyAddress = invoice.company?.address || "";
  const companyPhone   = invoice.company?.phone   || "";
  const companyEmail   = invoice.company?.email   || "";
  const companyWebsite = invoice.company?.website || "";
  const companyTaxId   = invoice.company?.taxId   || "";
  const companyLogoUrl = invoice.company?.logoUrl  || org.logoUrl || "";
  const orgBusinessInfo = org.businessInfo || "";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Action bar (screen only) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-8 print:hidden">
        <div>
          <Link href="/invoices" className="group inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
            Back to Invoices
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 font-display uppercase tracking-tight">{invoice.invoiceNumber || "INV-TEMP"}</h1>
            <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black border uppercase tracking-[0.2em] ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {invoice.status === "DRAFT" && (
            <form action={handleSendInvoice.bind(null, invoice.id)}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send Invoice
              </button>
            </form>
          )}
          {invoice.status === "SENT" && new Date(invoice.dueDate) < new Date() && (
            <form action={handleMarkOverdue.bind(null, invoice.id)}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100">
                Mark Overdue
              </button>
            </form>
          )}
          {(invoice.status === "SENT" || invoice.status === "PARTIAL" || invoice.status === "OVERDUE") && remaining > 0.001 && (
            <form action={handleQuickMarkPaid.bind(null, invoice.id)}>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Mark as Paid
              </button>
            </form>
          )}
          <Link href={`/invoices/${invoice.id}/edit`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</Link>
          <PrintButton />
        </div>
      </div>

      {/* ── Payments & Receipts (screen only) ── */}
      <InvoicePaymentsSection
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        invoiceStatus={invoice.status}
        recipientName={invoice.recipientName}
        grandTotal={total}
        paidTotal={paidTotal}
        remaining={remaining}
        payments={invoice.payments}
        tenantName={companyName}
        tenantLogoUrl={companyLogoUrl || null}
        tenantBusinessInfo={orgBusinessInfo || null}
      />

      {/* ══════════════════════════════════════════════
          PRINT DOCUMENT
      ══════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden mx-auto max-w-5xl print:!border-0 print:!shadow-none print:!rounded-none print:!max-w-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body:not(.print-single-receipt) * { visibility: hidden; }
            body:not(.print-single-receipt) .print-area,
            body:not(.print-single-receipt) .print-area * { visibility: visible; }
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
              <div className="text-5xl font-black tracking-tight uppercase leading-none" style={{ color: "#0d9488" }}>Invoice</div>
              {invoice.project && (
                <div className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Project: {invoice.project.name}
                </div>
              )}
            </div>
            <div className="text-right space-y-1 text-sm">
              <div className="flex justify-end gap-6">
                <span className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Invoice No</span>
                <span className="font-black text-slate-900 font-mono">{invoice.invoiceNumber || "—"}</span>
              </div>
              <div className="flex justify-end gap-6">
                <span className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Date</span>
                <span className="text-slate-700 font-medium">{format(invoice.issueDate, "dd MMM yyyy")}</span>
              </div>
              <div className="flex justify-end gap-6">
                <span className="text-slate-400 font-semibold uppercase text-xs tracking-wider">Due Date</span>
                <span className="text-slate-700 font-medium">{format(invoice.dueDate, "dd MMM yyyy")}</span>
              </div>
              <div className="pt-1">
                <span className={`inline-block px-3 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* ── Parties ── */}
          <div className="px-12 py-7 grid grid-cols-2 gap-12 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Billed To</div>
              <div className="text-base font-black text-slate-900 leading-tight">
                {invoice.recipientName || (invoice.project?.client as any)?.name || "Customer"}
              </div>
              {(invoice.recipientAddress || (invoice.project?.client as any)?.address) && (
                <div className="mt-1 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                  {invoice.recipientAddress || (invoice.project?.client as any)?.address}
                </div>
              )}
              {(invoice.project?.client as any)?.email && (
                <div className="mt-1 text-xs text-slate-500">{(invoice.project?.client as any).email}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">From</div>
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
                {(invoice.items as any[]).map((item, idx) => (
                  <tr key={item.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", color: "#1e293b" }}>{item.description}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", textAlign: "center", color: "#475569" }}>{Number(item.quantity || 0).toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#475569" }}>${fc(Number(item.unitPrice || 0))}</td>
                    <td style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: 600, color: "#1e293b" }}>${fc(Number(item.amount || 0))}</td>
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
              {paidTotal > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    <span>Paid to date</span><span>${fc(paidTotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", border: "2px solid #0d9488", color: "#0d9488", fontWeight: 900, fontSize: 14, borderRadius: 4 }}>
                    <span>BALANCE DUE</span><span>${fc(remaining)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Notes / Terms ── */}
          {(invoice.notes || invoice.terms || invoice.company?.notes) && (
            <div className="px-12 py-6 border-t border-slate-100 grid gap-6" style={{ gridTemplateColumns: invoice.notes && (invoice.terms || invoice.company?.notes) ? "1fr 1fr" : "1fr" }}>
              {invoice.notes && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Notes</div>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{invoice.notes}</div>
                </div>
              )}
              {(invoice.terms || invoice.company?.notes) && (
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Terms & Conditions</div>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{invoice.terms || invoice.company?.notes}</div>
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-12 py-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs italic text-slate-400">Thank you for your business.</p>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-600">{companyName}</p>
              {companyWebsite && <p className="text-[10px] text-slate-400">{companyWebsite}</p>}
            </div>
          </div>
          <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 6 }} />

        </div>
      </div>

      {/* ── Screen-only summary below the card ── */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-3">Billed To</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{invoice.recipientName || (invoice.project?.client as any)?.name || "Customer"}</h3>
            <p className="text-sm text-slate-500 whitespace-pre-wrap leading-relaxed max-w-sm mt-1">{invoice.recipientAddress || (invoice.project?.client as any)?.address || "Address Not Provided"}</p>
          </div>
          {invoice.project && (
            <div className="pt-6 border-t border-slate-100 max-w-sm">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Project Reference</p>
              <h3 className="text-base font-black text-teal-600 uppercase tracking-tight leading-tight">{invoice.project.name}</h3>
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
