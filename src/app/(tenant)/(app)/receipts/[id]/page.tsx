import { prisma } from "@/lib/prisma";
import { getOrganization } from "@/lib/organization-context";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { PrintButton } from "./print-button";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await getOrganization();

  const [payment, branding] = await Promise.all([
    prisma.invoicePayment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            recipientName: true,
            project: { select: { name: true } },
          },
        },
      },
    }),
    prisma.organization.findUnique({
      where: { id: org.id },
      select: { name: true, logoUrl: true, businessInfo: true },
    }),
  ]);

  if (!payment) notFound();

  const tenantName = branding?.name ?? org.name;
  const tenantLogoUrl = branding?.logoUrl ?? null;

  const amountFormatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(payment.amount)
  );
  const paidDate = format(new Date(payment.paidAt), "MMMM d, yyyy");
  const invoiceLabel = payment.invoice.invoiceNumber ?? "—";

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Screen-only toolbar */}
      <div className="print:hidden bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/receipts" className="text-sm font-medium text-teal-600 hover:text-teal-700">
          ← Back to Receipts
        </Link>
        <PrintButton />
      </div>

      {/* Receipt copies */}
      <div className="mx-auto max-w-2xl p-6 print:p-0 print:max-w-none space-y-0">
        {/* Customer copy */}
        <ReceiptSlip
          payment={payment}
          tenantName={tenantName}
          tenantLogoUrl={tenantLogoUrl}
          invoiceLabel={invoiceLabel}
          amountFormatted={amountFormatted}
          paidDate={paidDate}
          copyLabel="Customer copy"
        />

        {/* Dashed separator */}
        <div className="border-t-2 border-dashed border-slate-300 my-4 print:my-3" />

        {/* Office copy */}
        <ReceiptSlip
          payment={payment}
          tenantName={tenantName}
          tenantLogoUrl={tenantLogoUrl}
          invoiceLabel={invoiceLabel}
          amountFormatted={amountFormatted}
          paidDate={paidDate}
          copyLabel="Office copy"
        />
      </div>

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: #fff !important; margin: 0; }
        }
      `}</style>
    </div>
  );
}

function ReceiptSlip({
  payment,
  tenantName,
  tenantLogoUrl,
  invoiceLabel,
  amountFormatted,
  paidDate,
  copyLabel,
}: {
  payment: {
    receiptNumber: string | null;
    paymentMethod: string | null;
    reference: string | null;
    accountNo: string | null;
    notes: string | null;
    invoice: { recipientName: string | null };
  };
  tenantName: string;
  tenantLogoUrl: string | null;
  invoiceLabel: string;
  amountFormatted: string;
  paidDate: string;
  copyLabel: string;
}) {
  const rows = [
    { label: "Received with thanks from", value: payment.invoice.recipientName ?? "—", bold: true },
    { label: "For invoice", value: invoiceLabel + (payment.notes ? ` — ${payment.notes}` : ""), bold: true },
    { label: "Payment method", value: payment.paymentMethod ?? "—", bold: false },
    { label: "Account No", value: payment.accountNo ?? "—", bold: false },
    { label: "Reference", value: payment.reference ?? "—", bold: false },
  ];

  return (
    <div
      className="receipt-slip bg-white rounded-xl overflow-hidden print:rounded-none"
      style={{ fontFamily: "sans-serif" }}
    >
      {/* Top bar */}
      <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 6 }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "14px 20px 12px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tenantLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenantLogoUrl}
              alt="Logo"
              style={{ height: 44, width: "auto", maxWidth: 100, objectFit: "contain" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                background: "#0d9488",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>
                {tenantName.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, color: "#0f172a", letterSpacing: -0.3 }}>{tenantName}</div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: 2,
              }}
            >
              {copyLabel}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-block",
              border: "2px solid #0d9488",
              borderRadius: 6,
              padding: "4px 14px",
              color: "#0d9488",
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: "0.08em",
            }}
          >
            MONEY RECEIPT
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>
            <span style={{ fontWeight: 700 }}>Receipt No: </span>
            <span style={{ fontWeight: 900, color: "#0f172a", fontFamily: "monospace" }}>
              {payment.receiptNumber ?? "—"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            <span style={{ fontWeight: 700 }}>Date: </span>
            {paidDate}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 20px 16px", fontSize: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {rows.map(({ label, value, bold }) => (
              <tr key={label}>
                <td
                  style={{
                    padding: "5px 12px 5px 0",
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    width: 160,
                    verticalAlign: "bottom",
                  }}
                >
                  {label}:
                </td>
                <td
                  style={{
                    padding: "5px 0 4px",
                    borderBottom: "1px dotted #cbd5e1",
                    fontWeight: bold ? 700 : 400,
                    color: "#0f172a",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Amount box */}
        <div
          style={{
            marginTop: 16,
            padding: "10px 14px",
            border: "2px solid #0d9488",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f0fdfa",
          }}
        >
          <span style={{ color: "#0f766e", fontWeight: 700, fontSize: 12 }}>Amount received:</span>
          <span
            style={{
              background: "#0d9488",
              color: "#fff",
              fontWeight: 900,
              fontSize: 16,
              padding: "5px 20px",
              borderRadius: 4,
              letterSpacing: 0.5,
            }}
          >
            {amountFormatted}
          </span>
        </div>

        {/* Signature row */}
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>This receipt is valid proof of payment.</div>
          <div style={{ textAlign: "center", minWidth: 180 }}>
            <div style={{ borderBottom: "1px solid #94a3b8", marginBottom: 4, height: 32 }} />
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Authorized Signature
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: "linear-gradient(90deg,#0d9488,#0891b2)", height: 4 }} />
    </div>
  );
}
