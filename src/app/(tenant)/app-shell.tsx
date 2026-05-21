"use client";

import { useState } from "react";
import { AppNavbar } from "./app-navbar";
import { TenantNav } from "./tenant-nav";

export function AppShell({
  userEmail,
  organizationName,
  enabledModules = [],
  children,
}: {
  userEmail: string;
  organizationName: string;
  enabledModules?: string[];
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white selection:bg-teal-100 selection:text-teal-900">
      <div className="print:hidden">
        <AppNavbar
          userEmail={userEmail}
          organizationName={organizationName}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <TenantNav
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          enabledModules={enabledModules}
        />
      </div>
      <main className="min-h-screen overflow-x-hidden pt-16 lg:ml-64 print:ml-0 print:pt-0 transition-all duration-300">
        <div className="w-full max-w-[1600px] mx-auto p-6 sm:p-10 lg:p-12 print:p-8 animate-in fade-in duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}
