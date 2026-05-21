import { ClientForm } from "../client-form";

export default async function NewClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Add client</h1>
      <ClientForm />
    </div>
  );
}
