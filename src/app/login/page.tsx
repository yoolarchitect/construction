import { redirect } from "next/navigation";
import { getOrganization } from "@/lib/organization-context";
import { getUserFromSession } from "@/lib/auth";
import { TenantLoginForm } from "./tenant-login-form";

export default async function LoginPage() {
  let org;
  try {
    org = await getOrganization();
  } catch {
    redirect("/contact");
  }

  const session = await getUserFromSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{org.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
          <div className="mt-8">
            <TenantLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
