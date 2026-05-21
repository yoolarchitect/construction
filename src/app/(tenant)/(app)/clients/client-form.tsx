"use client";

import { useFormState } from "react-dom";
import { createClientAction } from "./actions";
import Link from "next/link";
import { useFormAlert } from "@/components/useFormAlert";

export function ClientForm() {
  const [state, formAction] = useFormState(createClientAction, null);
  useFormAlert(state);

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Name
        </label>
        <input id="name" name="name" required className="input" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input id="email" name="email" type="email" className="input" />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
          Phone
        </label>
        <input id="phone" name="phone" type="tel" className="input" />
      </div>
      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium text-slate-700">
          Address
        </label>
        <textarea id="address" name="address" rows={2} className="input" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary">
          Add
        </button>
        <Link href="/clients" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
