import { headers } from "next/headers";

export async function getTenantIdFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-id") || null;
}

export async function getTenantSlugFromHeaders(): Promise<string | null> {
  const h = await headers();
  return h.get("x-tenant-slug") || null;
}
