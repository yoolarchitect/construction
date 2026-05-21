import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "../../project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, clients, companies] = await Promise.all([
    prisma.project.findFirst({ where: { id } }),
    prisma.client.findMany({ select: { id: true, name: true } }),
    prisma.company.findMany({ select: { id: true, name: true, isDefault: true } }),
  ]);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Edit project</h1>
        <Link href={`/projects/${id}`} className="btn btn-secondary">
          ← Back
        </Link>
      </div>
      <ProjectForm project={project} clients={clients} companies={companies} />
    </div>
  );
}
