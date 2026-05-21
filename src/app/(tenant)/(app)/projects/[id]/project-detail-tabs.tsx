"use client";

import { useState } from "react";
import { ProjectInstallmentsSection } from "./project-installments";
import { ProjectExpensesSection } from "./project-expenses-section";
import { ProjectDocumentsSection } from "./project-documents-section";

type TabId = "installments" | "expenses" | "documents";

type Installment = {
  id: string;
  label: string;
  amount: number;
  dueDate: Date;
  sortOrder: number;
};

type ExpenseItem = {
  id: string;
  materials: string;
  quantity: { toString(): string };
  unitPrice: { toString(): string };
};

type ExpenseDocument = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  createdAt: Date;
};

type Expense = {
  id: string;
  title: string;
  amount: { toString(): string };
  expenseDate: Date;
  items: ExpenseItem[];
  documents: ExpenseDocument[];
};

type ProjectDocument = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  createdAt: Date;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "expenses", label: "Expenses" },
  { id: "installments", label: "Installments" },
  { id: "documents", label: "Documents" },
];

export function ProjectDetailTabs({
  projectId,
  installments,
  expenses,
  documents,
  canAddExpense,
  organizationId,
}: {
  projectId: string;
  installments: Installment[];
  expenses: Expense[];
  documents: ProjectDocument[];
  canAddExpense: boolean;
  organizationId: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("expenses");

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Tab bar - responsive: horizontal scroll on small screens */}
      <div className="border-b border-slate-200">
        <nav
          className="flex gap-0 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thin [-webkit-overflow-scrolling:touch] sm:overflow-x-visible"
          aria-label="Project sections"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] min-w-[120px] shrink-0 touch-manipulation border-b-2 px-4 py-3.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:min-w-0 sm:px-6 ${
                activeTab === tab.id
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4 sm:p-6">
        {activeTab === "installments" && (
          <ProjectInstallmentsSection projectId={projectId} installments={installments} embedded />
        )}
        {activeTab === "expenses" && (
          <ProjectExpensesSection
            projectId={projectId}
            expenses={expenses}
            canAddExpense={canAddExpense}
            organizationId={organizationId}
          />
        )}
        {activeTab === "documents" && (
          <ProjectDocumentsSection
            projectId={projectId}
            documents={documents}
            organizationId={organizationId}
          />
        )}
      </div>
    </div>
  );
}
