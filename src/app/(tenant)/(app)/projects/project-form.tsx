"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { createProjectAction, updateProjectAction } from "./actions";
import Link from "next/link";
import { useFormAlert } from "@/components/useFormAlert";
import { SearchableSelect } from "@/components/SearchableSelect";

const STATUSES: { value: string; label: string }[] = [
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

type ProjectForForm = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  budget: { toString(): string };
  status: string;
  startDate: Date;
  endDate: Date | null;
  clientId: string | null;
};

type Client = { id: string; name: string };
type Company = { id: string; name: string; isDefault?: boolean };

export function ProjectForm({
  project,
  clients = [],
  companies = [],
}: {
  project?: ProjectForForm;
  clients?: Client[];
  companies?: Company[];
}) {
  const [state, formAction] = useFormState(project ? updateProjectAction : createProjectAction, null);
  useFormAlert(state);

  const startStr = project?.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "";
  const endStr = project?.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : "";

  return (
    <form action={formAction} className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {project && <input type="hidden" name="id" value={project.id} />}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="page-title text-3xl font-black">{project ? "Edit Project" : "Create New Project"}</h1>
            <p className="page-subtitle">Define the core parameters of your construction project</p>
          </div>
          <Link href={project ? `/projects/${project.id}` : "/projects"} className="btn btn-ghost bg-white/50 border border-slate-200 self-start md:self-center">
            Go back
          </Link>
        </div>
        
        <ProjectFormFields
          project={project}
          clients={clients}
          companies={companies}
          startStr={startStr}
          endStr={endStr}
          STATUSES={STATUSES}
        />
      </div>
    </form>
  );
}

function ProjectFormFields({
  project,
  clients,
  companies,
  startStr,
  endStr,
  STATUSES,
}: {
  project?: ProjectForForm;
  clients: Client[];
  companies: Company[];
  startStr: string;
  endStr: string;
  STATUSES: { value: string; label: string }[];
}) {
  const { pending } = useFormStatus();
  const defaultCompany = companies.find(c => c.isDefault);
  const [clientId, setClientId] = useState(project?.clientId ?? "");
  const [companyId, setCompanyId] = useState((project as any)?.companyId ?? defaultCompany?.id ?? "");

  const clientOptions = [
    { value: "", label: "None" },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const companyOptions = [
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <fieldset disabled={pending} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="card !p-8">
          <h2 className="text-xl font-bold mb-6 text-slate-900 border-b border-slate-50 pb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/></svg>
            Identity & Details
          </h2>
          <div className="space-y-6">
            <div className="group">
              <label htmlFor="name" className="label">Project Name</label>
              <input
                id="name"
                name="name"
                required
                className="input transition-all group-focus-within:ring-teal-500/20"
                placeholder="e.g. Skyline Apartments Phase 2"
                defaultValue={project?.name}
              />
            </div>
            <div className="group">
              <label htmlFor="description" className="label">Overview / Scope</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="input resize-none"
                placeholder="High-level description of what this project entails..."
                defaultValue={project?.description ?? ""}
              />
            </div>
            <div className="group">
              <label htmlFor="location" className="label">Project Location</label>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <input
                  id="location"
                  name="location"
                  className="input pl-11"
                  placeholder="Street address, coordinates or region"
                  defaultValue={project?.location ?? ""}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card !p-8">
          <h2 className="text-xl font-bold mb-6 text-slate-900 border-b border-slate-50 pb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/><path d="M2 12h20"/><path d="m5 7-3 5 3 5"/><path d="m19 7 3 5-3 5"/></svg>
            Financial & Stakeholders
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="group">
              <label htmlFor="budget" className="label">Estimated Budget</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="input pl-9"
                  placeholder="0.00"
                  defaultValue={project?.budget != null ? String(project.budget) : ""}
                />
              </div>
            </div>
            <div className="group">
              <label htmlFor="status" className="label">Current Lifecycle State</label>
              <select id="status" name="status" className="input pr-10" defaultValue={project?.status ?? "PLANNING"}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 grid gap-6 sm:grid-cols-2">
              <div className="group">
                <label htmlFor="clientId" className="label">External Client</label>
                <SearchableSelect
                  name="clientId"
                  value={clientId}
                  onChange={setClientId}
                  options={clientOptions}
                  placeholder="Assign a client"
                  className="w-full"
                />
              </div>
              <div className="group">
                <label htmlFor="companyId" className="label">Issuing Internal Entity</label>
                <SearchableSelect
                  name="companyId"
                  value={companyId}
                  onChange={setCompanyId}
                  options={companyOptions}
                  placeholder="Select entity"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="card !p-8 bg-slate-900 !text-white !border-slate-800 shadow-2xl shadow-indigo-500/10">
          <h2 className="text-xl font-black mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
             Timeline
          </h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="startDate" className="label !text-slate-400">Kickoff Date</label>
              <input id="startDate" name="startDate" type="date" required className="input !bg-white/10 !border-white/10 !text-white focus:!ring-teal-400/30" defaultValue={startStr} />
            </div>
            <div>
              <label htmlFor="endDate" className="label !text-slate-400">Target Completion</label>
              <input id="endDate" name="endDate" type="date" className="input !bg-white/10 !border-white/10 !text-white focus:!ring-teal-400/30" defaultValue={endStr} />
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col gap-3">
             <button
              type="submit"
              className="btn btn-primary w-full py-4 text-base shadow-xl shadow-teal-500/20"
              disabled={pending}
            >
              {pending && (
                <svg className="h-5 w-5 mr-3 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {pending ? "Processing..." : (project ? "Propagate Updates" : "Initialize Project")}
            </button>
            <Link href={project ? `/projects/${project.id}` : "/projects"} className="btn btn-ghost text-slate-400 hover:text-white hover:bg-white/5 transition-all">
              Discard Changes
            </Link>
          </div>
        </div>

        <div className="stat-card p-6 bg-teal-600/5 border-teal-600/10">
           <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Pro Tip</p>
           <p className="text-sm text-slate-600 leading-relaxed font-medium">
             Accurate timelines and budgets help the system generate more precise financial reports and resource projections.
           </p>
        </div>
      </div>
    </fieldset>
  );
}
