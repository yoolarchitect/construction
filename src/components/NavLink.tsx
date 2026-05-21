"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href.length > 1 && pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      className={isActive ? "nav-link nav-link-active" : "nav-link"}
    >
      {children}
    </Link>
  );
}
