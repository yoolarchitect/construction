"use client";

import { useCallback } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { BalanceSheetData } from "./report-balance-sheet";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type BalanceSheetExportButtonsProps = {
  data: BalanceSheetData;
  asAtLabel: string;
  generatedAt: string;
  tenantName: string;
  tenantLogoUrl: string | null;
  tenantBusinessInfo: string | null;
};

export function BalanceSheetExportButtons({
  data,
  asAtLabel,
  generatedAt,
  tenantName,
  tenantLogoUrl,
  tenantBusinessInfo,
}: BalanceSheetExportButtonsProps) {
  const totalAssets =
    data.totalReceived +
    data.receivables +
    data.fixedAssetsTotal +
    data.currentAssetsTotal;

  const exportXlsx = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      [tenantName],
      ...(tenantBusinessInfo ? [[tenantBusinessInfo]] : []),
      [],
      ["BALANCE SHEET"],
      ["As at", asAtLabel],
      ["Generated", generatedAt],
      [],
      ["Assets", ""],
      ["Received from clients (deposits)", data.totalReceived],
      ["Receivables", data.receivables],
      ...(data.fixedAssetsTotal > 0 ? [["Fixed assets", data.fixedAssetsTotal]] : []),
      ...(data.currentAssetsTotal > 0 ? [["Current assets", data.currentAssetsTotal]] : []),
      ["Total Assets", totalAssets],
      [],
      ["Equity", ""],
      ["Total contract value (budget)", data.totalBudget],
      ["Less: Costs incurred", -data.totalExpenses],
      ["Net position", data.netPosition],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 42 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");
    const filename = `balance-sheet-${asAtLabel.replace(/\s+/g, "-")}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [
    data,
    asAtLabel,
    generatedAt,
    tenantName,
    tenantBusinessInfo,
    totalAssets,
  ]);

  const exportPdf = useCallback(async () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let y = 14;

    // Header: logo (if available), title, tenant info
    const pageW = (doc as unknown as { internal: { pageSize: { getWidth(): number } } }).internal.pageSize.getWidth();
    const margin = 14;

    if (tenantLogoUrl) {
      try {
        const img = await loadImageAsBase64(tenantLogoUrl);
        if (img) {
          doc.addImage(img, "PNG", margin, y, 18, 18);
        }
      } catch {
        // ignore logo load failure
      }
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BALANCE SHEET", pageW / 2, y + 10, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`As at ${asAtLabel}`, pageW / 2, y + 16, { align: "center" });
    y += 22;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(tenantName, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (tenantBusinessInfo) {
      const split = doc.splitTextToSize(tenantBusinessInfo, pageW - 2 * margin);
      doc.text(split, margin, y);
      y += split.length * 5 + 4;
    } else {
      y += 4;
    }
    doc.setFontSize(8);
    doc.text(`Generated: ${generatedAt}`, margin, y);
    y += 10;

    const tableData: string[][] = [
      ["Received from clients (deposits)", fmt(data.totalReceived)],
      ["Receivables", fmt(data.receivables)],
      ...(data.fixedAssetsTotal > 0
        ? [["Fixed assets", fmt(data.fixedAssetsTotal)]]
        : []),
      ...(data.currentAssetsTotal > 0
        ? [["Current assets", fmt(data.currentAssetsTotal)]]
        : []),
      ["Total Assets", fmt(totalAssets)],
      ["", ""],
      ["Total contract value (budget)", fmt(data.totalBudget)],
      ["Less: Costs incurred", `(${fmt(data.totalExpenses)})`],
      ["Net position", fmt(data.netPosition)],
    ];

    autoTable(doc, {
      startY: y,
      head: [["Assets / Equity", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [15, 118, 110], fontStyle: "bold", textColor: 255 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 55, halign: "right" },
      },
      margin: { left: margin },
      tableWidth: pageW - 2 * margin,
    });

    doc.save(`balance-sheet-${asAtLabel.replace(/\s+/g, "-")}.pdf`);
  }, [
    data,
    asAtLabel,
    generatedAt,
    tenantName,
    tenantBusinessInfo,
    tenantLogoUrl,
    totalAssets,
  ]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={exportXlsx}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h2" />
          <path d="M8 17h2" />
          <path d="M16 13h2" />
          <path d="M16 17h2" />
        </svg>
        Export Excel
      </button>
      <button
        type="button"
        onClick={() => exportPdf()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 18H8" />
          <path d="M12 12v6" />
        </svg>
        Export PDF
      </button>
    </div>
  );
}

function loadImageAsBase64(url: string): Promise<string | null> {
  return fetch(url, { mode: "cors" })
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string | null);
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);
}
