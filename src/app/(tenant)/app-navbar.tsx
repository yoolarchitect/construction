"use client";

import { useRef } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { appLogoutAction } from "@/app/(tenant)/actions";

export function AppNavbar({
  userEmail,
  organizationName,
  onMenuClick,
}: {
  userEmail: string;
  organizationName: string;
  onMenuClick?: () => void;
}) {
  const logoutFormRef = useRef<HTMLFormElement>(null);

  const handleLogoutClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to end your current session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0d9488",
      cancelButtonColor: "#f1f5f9",
      confirmButtonText: "Yes, Log out",
      cancelButtonText: "Stay logged in",
      customClass: {
        popup: 'rounded-[1.5rem] border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] backdrop-blur-3xl bg-white/90 p-8',
        title: 'text-2xl font-black text-slate-900',
        htmlContainer: 'text-slate-500 font-medium',
        confirmButton: 'btn btn-primary !rounded-xl !px-8 !py-3 !text-sm !font-black !uppercase !tracking-widest shadow-xl shadow-teal-500/20',
        cancelButton: 'btn btn-secondary !rounded-xl !px-8 !py-3 !text-sm !font-black !uppercase !tracking-widest !text-slate-500',
      }
    });
    if (result.isConfirmed && logoutFormRef.current) {
      logoutFormRef.current.requestSubmit();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-white bg-white/60 px-4 backdrop-blur-2xl transition-all sm:px-8">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="flex lg:hidden -ml-2 rounded-2xl p-2.5 text-slate-500 hover:bg-slate-100/50 active:scale-95 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </button>
        )}
        <Link
          href="/"
          className="flex items-center gap-3.5 rounded-2xl px-2 py-1.5 transition-all hover:bg-white/40 active:scale-[0.98] group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 font-black text-white shadow-xl shadow-teal-500/20 group-hover:scale-105 transition-transform">
            {organizationName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black tracking-tight text-slate-900 text-lg leading-none">{organizationName}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mt-1">Management Hub</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4 sm:gap-8">
        <div className="hidden flex-col items-end sm:flex border-r border-slate-100 pr-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Authenticated as
          </p>
          <p className="truncate max-w-[140px] lg:max-w-[180px] text-sm font-black text-slate-900" title={userEmail}>
            {userEmail.split('@')[0]}
            <span className="text-slate-400 font-medium">@{userEmail.split('@')[1]}</span>
          </p>
        </div>
        <form ref={logoutFormRef} action={appLogoutAction}>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="group flex h-11 items-center gap-3 rounded-2xl bg-slate-900 px-5 text-sm font-black text-white transition-all hover:bg-red-600 hover:shadow-2xl hover:shadow-red-500/30 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span className="hidden sm:inline uppercase tracking-widest text-[11px]">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
