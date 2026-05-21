"use client";

import { useCallback } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportProjectExport = {
  name: string;
  clientName: string | null;
  budget: number;
  received: number;
  status: string;
  startEnd: string;
  expenses: Array<{
    date: string;
    material: string;
    qty: number;
    unitPrice: number;
    amount: number;
  }>;
  totalExpenses: number;
};

type ReportExportButtonsProps = {
  reportData: ReportProjectExport[];
  periodLabel: string;
  generatedAt: string;
};

export function ReportExportButtons({ reportData, periodLabel, generatedAt }: ReportExportButtonsProps) {
  const exportXlsx = useCallback(() => {
    const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      ["Financial Report"],
      ["Period:", periodLabel],
      ["Generated:", generatedAt],
      [],
    ];
    for (const p of reportData) {
      rows.push([p.name]);
      rows.push(["Client", p.clientName ?? "", "Budget", fmt.format(p.budget), "Received", fmt.format(p.received)]);
      rows.push(["Status", p.status, "Start – End", p.startEnd]);
      rows.push([]);
      rows.push(["Date", "Material", "Qty", "Unit price", "Amount"]);
      for (const e of p.expenses) {
        rows.push([e.date, e.material, e.qty, e.unitPrice, e.amount]);
      }
      rows.push(["", "", "", "Total", p.totalExpenses]);
      rows.push([]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths = [{ wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const filename = `financial-report-${periodLabel.replace(/\s+/g, "-")}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [reportData, periodLabel, generatedAt]);

  const exportPdf = useCallback(() => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    let y = 15;
    doc.setFontSize(16);
    doc.text("Financial Report", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Period: ${periodLabel}`, 14, y);
    y += 6;
    doc.text(`Generated: ${generatedAt}`, 14, y);
    y += 12;

    for (const p of reportData) {
      if (y > 250) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(p.name, 14, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Client: ${p.clientName ?? "—"}  |  Budget: ${fmt.format(p.budget)}  |  Received: ${fmt.format(p.received)}  |  Status: ${p.status}`, 14, y);
      y += 6;

      const tableData = p.expenses.map((e) => [e.date, e.material, String(e.qty), fmt.format(e.unitPrice), fmt.format(e.amount)]);
      autoTable(doc, {
        startY: y,
        head: [["Date", "Material", "Qty", "Unit price", "Amount"]],
        body: tableData,
        foot: [["", "", "", "Total", fmt.format(p.totalExpenses)]],
        theme: "grid",
        headStyles: { fillColor: [248, 250, 252], fontStyle: "bold" },
        footStyles: { fillColor: [248, 250, 252], fontStyle: "bold" },
        margin: { left: 14 },
        tableWidth: "auto",
      });
      const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
      y = (lastTable?.finalY ?? y) + 12;
    }

    doc.save(`financial-report-${periodLabel.replace(/\s+/g, "-")}.pdf`);
  }, [reportData, periodLabel, generatedAt]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={exportXlsx}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h2" />
          <path d="M8 17h2" />
          <path d="M16 13h2" />
          <path d="M16 17h2" />
        </svg>
        Export XLSX
      </button>
      <button
        type="button"
        onClick={exportPdf}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
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
