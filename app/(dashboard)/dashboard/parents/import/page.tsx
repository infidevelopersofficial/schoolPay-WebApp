import { BulkImportForm } from "@/components/parents/bulk-import-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Import Parents — SchoolPay",
  description: "Import parents via CSV",
};

export default function BulkImportPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Bulk Import</h1>
        <p className="text-slate-400 text-sm mt-1">Upload multiple parents at once using a CSV file.</p>
      </div>

      <BulkImportForm />
    </div>
  );
}
