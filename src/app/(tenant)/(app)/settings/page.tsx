import { getOrganization } from "@/lib/organization-context";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const org = await getOrganization();
  const data = await prisma.organization.findUnique({
    where: { id: org.id },
    select: { name: true, businessInfo: true, logoUrl: true, faviconUrl: true },
  });

  if (!data) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="page-title text-4xl">System Settings</h1>
        <p className="page-subtitle text-lg">Configure your brand identity, business information, and asset storage preferences.</p>
      </div>
      <div className="card !p-0 overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-teal-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Customization</h2>
              <p className="text-sm font-medium text-slate-500">Update your organization profile and branding.</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <SettingsForm
            initialName={data.name}
            initialBusinessInfo={data.businessInfo}
            initialLogoUrl={data.logoUrl}
            initialFaviconUrl={data.faviconUrl}
            organizationId={org.id}
          />
        </div>
      </div>
    </div>
  );
}
