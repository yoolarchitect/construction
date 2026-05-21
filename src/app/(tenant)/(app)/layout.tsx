import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getOrganization } from "@/lib/organization-context";
import { getUserFromSession } from "@/lib/auth";
import { AppShell } from "../app-shell";
import { ImageKitProvider } from "@imagekit/next";
import { getEnabledModules } from "@/lib/modules";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrganization();
  if (org.faviconUrl) {
    return { icons: { icon: org.faviconUrl } };
  }
  return {};
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await getOrganization();
  const session = await getUserFromSession();
  if (!session) {
    redirect("/login");
  }

  const enabledModules = await getEnabledModules();

  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || "";
  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      <AppShell userEmail={session.email} organizationName={org.name} enabledModules={enabledModules}>
        {children}
      </AppShell>
    </ImageKitProvider>
  );
}
