"use server";

import { revalidatePath } from "next/cache";
import { getOrganization } from "@/lib/organization-context";
import { prisma } from "@/lib/prisma";

export async function createCompany(formData: FormData) {
  const org = await getOrganization();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const website = formData.get("website") as string;
  const taxId = formData.get("taxId") as string;
  const notes = formData.get("notes") as string;
  const logoUrl = formData.get("logoUrl") as string;

  if (!name) throw new Error("Name is required");

  const fullOrg = await prisma.organization.findUnique({
    where: { id: org.id },
  });

  if (!fullOrg) throw new Error("Organization not found");

  const companyCount = await prisma.company.count();

  if (companyCount > 0 && !fullOrg.hasMultipleCompanies) {
    throw new Error(
      "Multiple companies are disabled. Enable them in the database (Organization.hasMultipleCompanies) or remove extra companies."
    );
  }

  await prisma.company.create({
    data: {
      name,
      email,
      phone,
      address,
      website,
      taxId,
      notes,
      logoUrl: logoUrl || null,
      isDefault: companyCount === 0,
    },
  });

  revalidatePath("/companies");
}

export async function updateCompany(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const website = formData.get("website") as string;
  const taxId = formData.get("taxId") as string;
  const notes = formData.get("notes") as string;
  const logoUrl = formData.get("logoUrl") as string;

  if (!name) throw new Error("Name is required");

  await prisma.company.update({
    where: { id },
    data: { name, email, phone, address, website, taxId, notes, logoUrl: logoUrl || null },
  });

  revalidatePath("/companies");
}

export async function deleteCompany(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          projects: true,
          expenses: true,
          invoices: true,
          assets: true,
        },
      },
    },
  });

  if (!company) throw new Error("Company not found");

  const totalItems = (Object.values(company._count) as number[]).reduce(
    (acc, val) => acc + val,
    0
  );
  if (totalItems > 0) {
    throw new Error("Cannot delete company with existing data (projects, expenses, invoices, etc.)");
  }

  await prisma.company.delete({
    where: { id },
  });

  revalidatePath("/companies");
}

export async function setDefaultCompany(id: string) {
  await prisma.$transaction([
    prisma.company.updateMany({
      where: {},
      data: { isDefault: false },
    }),
    prisma.company.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/companies");
}
