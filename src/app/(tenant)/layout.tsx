import { getOrganization } from "@/lib/organization-context";

export default async function AppChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getOrganization();
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="w-full">{children}</main>
    </div>
  );
}
