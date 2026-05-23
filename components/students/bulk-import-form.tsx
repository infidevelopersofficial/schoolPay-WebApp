"use client";

import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud, AlertCircle, CheckCircle2, Loader2, Download, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { importStudentsAction } from "@/app/(dashboard)/students/import/actions";

export function BulkImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{imported: number, skipped: number} | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setErrors([]);
    setSuccess(null);

    if (selected.name.endsWith('.csv')) {
      Papa.parse(selected, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data);
          validateData(results.data);
        },
        error: (error) => {
          setErrors([error.message]);
        }
      });
    } else if (selected.name.endsWith('.xlsx') || selected.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          setParsedData(data);
          validateData(data);
        } catch (err: any) {
          setErrors(["Failed to parse Excel file. Ensure it is valid."]);
        }
      };
      reader.readAsBinaryString(selected);
    } else {
      setErrors(["Unsupported file type. Please upload CSV or Excel."]);
    }
  };

  const validateData = (data: any[]) => {
    const validationErrors: string[] = [];
    data.forEach((row, index) => {
      if (!row.firstName || !row.lastName) {
        validationErrors.push(`Row ${index + 1}: Missing First Name or Last Name`);
      }
      if (!row.email) {
        validationErrors.push(`Row ${index + 1}: Missing Email`);
      }
    });
    setErrors(validationErrors);
  };

  const handleImport = async () => {
    if (errors.length > 0) return;
    setLoading(true);
    try {
      const result = await importStudentsAction(parsedData);
      setSuccess({ imported: result.imported, skipped: result.duplicatesSkipped });
      setParsedData([]);
      setFile(null);
    } catch (err: any) {
      setErrors([err.message || "Failed to import students"]);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { firstName: "John", lastName: "Doe", email: "john@example.com", phone: "9876543210", class: "Class 10", section: "A", rollNumber: "101" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Students</CardTitle>
          <CardDescription>Upload a CSV or Excel file to bulk import students.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 mb-6 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <Download className="w-5 h-5 text-blue-400" />
              <span>Need the correct format?</span>
            </div>
            <button 
              onClick={downloadTemplate}
              type="button"
              className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:bg-slate-800/50 transition-colors relative">
            {file && (
              <button 
                onClick={(e) => { e.preventDefault(); setFile(null); setParsedData([]); setErrors([]); setSuccess(null); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={handleFileUpload}
              className="hidden" 
              id="csv-upload" 
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
              <span className="text-sm font-medium text-slate-200">
                {file ? file.name : "Click to upload CSV or Excel file"}
              </span>
              <span className="text-xs text-slate-500 mt-2">Maximum file size: 5MB</span>
            </label>
          </div>

          {errors.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center space-x-2 text-red-400 font-medium mb-2">
                <AlertCircle className="w-5 h-5" />
                <span>Validation Errors</span>
              </div>
              <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 5 && (
                  <li>...and {errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Successfully imported {success.imported} students!</span>
              </div>
              {success.skipped > 0 && (
                <p className="text-sm text-emerald-300/80 ml-7">Skipped {success.skipped} duplicate records.</p>
              )}
            </div>
          )}

          {parsedData.length > 0 && errors.length === 0 && !success && (
            <div className="mt-6">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                <p className="text-sm text-blue-300">
                  Ready to import <strong className="text-blue-100">{parsedData.length}</strong> students.
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full h-11 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


