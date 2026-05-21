import { cache } from "react";
import { prisma } from "./prisma";

export class OrganizationNotConfiguredError extends Error {
  constructor() {
    super("Organization is not configured. Run database seed.");
    this.name = "OrganizationNotConfiguredError";
  }
}

export const getOrganization = cache(async () => {
  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new OrganizationNotConfiguredError();
  }
  return org;
});
