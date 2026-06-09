"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud, AlertCircle, CheckCircle2, Loader2, Download, X, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importStudentsBatchAction } from "@/app/(dashboard)/dashboard/students/import/actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function BulkImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import State
  const [createParentAccounts, setCreateParentAccounts] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successResult, setSuccessResult] = useState<{ imported: number, skipped: number } | null>(null);

  const REQUIRED_FIELDS = ["name", "class"];

  const processFile = (selected: File) => {
    setFile(selected);
    setValidationErrors({});
    setSuccessResult(null);

    if (selected.name.endsWith('.csv')) {
      Papa.parse(selected, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as any[];
          setParsedData(data);
          validateAllData(data);
        },
        error: (error) => toast.error(error.message)
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
          validateAllData(data);
        } catch (err: any) {
          toast.error("Failed to parse Excel file. Ensure it is valid.");
        }
      };
      reader.readAsBinaryString(selected);
    } else {
      toast.error("Unsupported file type. Please upload CSV or Excel.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) processFile(selected);
  };

  const validateAllData = (data: any[]) => {
    const newErrors: Record<number, string[]> = {};
    const rollNumbers = new Set<string>();

    data.forEach((row, index) => {
      const rowErrors: string[] = [];
      
      REQUIRED_FIELDS.forEach(field => {
        if (!row[field] || String(row[field]).trim() === "") {
          rowErrors.push(`Missing ${field}`);
        }
      });

      if (row.roll_number) {
        if (rollNumbers.has(row.roll_number)) {
          rowErrors.push(`Duplicate roll_number in file: ${row.roll_number}`);
        }
        rollNumbers.add(row.roll_number);
      }

      if (row.parent_email && !/^\S+@\S+\.\S+$/.test(row.parent_email)) {
        rowErrors.push("Invalid parent_email format");
      }

      if (row.parent_phone && !/^\+?\d{10,15}$/.test(row.parent_phone.toString().replace(/\s/g, ''))) {
        rowErrors.push("Invalid parent_phone format");
      }

      if (rowErrors.length > 0) {
        newErrors[index] = rowErrors;
      }
    });

    setValidationErrors(newErrors);
  };

  const handleInlineEdit = (index: number, field: string, value: string) => {
    const newData = [...parsedData];
    newData[index] = { ...newData[index], [field]: value };
    setParsedData(newData);
    // Revalidate after a short delay (debounced conceptually, but direct for simplicity here)
    validateAllData(newData);
  };

  const handleImport = async () => {
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix all validation errors before importing.");
      return;
    }

    setIsImporting(true);
    setProgress(0);
    
    let totalImported = 0;
    let totalSkipped = 0;
    const CHUNK_SIZE = 100;
    const totalChunks = Math.ceil(parsedData.length / CHUNK_SIZE);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunk = parsedData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const res = await importStudentsBatchAction(chunk, createParentAccounts);
        
        if ("error" in res && res.error) {
          throw new Error(res.error);
        }

        if ("success" in res && res.success) {
          totalImported += res.imported || 0;
          totalSkipped += res.skipped || 0;
        }

        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      setSuccessResult({ imported: totalImported, skipped: totalSkipped });
      toast.success("Import completed successfully!");
      setParsedData([]);
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to import students. Check your plan limits or data.");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [{
      name: "John Doe",
      roll_number: "101",
      class: "Class 10",
      section: "A",
      dob: "2010-05-15",
      parent_name: "Robert Doe",
      parent_phone: "9876543210",
      parent_email: "robert@example.com",
      address: "123 Main St, City"
    }];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Bulk_Import_Template.xlsx");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Import Students</CardTitle>
              <CardDescription>Upload a CSV or Excel file to bulk import students.</CardDescription>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!file && (
            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                onChange={handleFileUpload}
                className="hidden" 
                ref={fileInputRef}
              />
              <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-200">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-slate-500 mt-2">Supports .csv and .xlsx up to 5MB</p>
            </div>
          )}

          {file && !isImporting && !successResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-400">{parsedData.length} records parsed</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setParsedData([]); }}>
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>

              {/* Settings Toggle */}
              <div className="flex items-center space-x-2">
                <Switch 
                  id="create-parents" 
                  checked={createParentAccounts}
                  onCheckedChange={setCreateParentAccounts}
                />
                <Label htmlFor="create-parents" className="text-sm cursor-pointer">
                  Auto-create Parent Accounts & send invites (Requires parent_email/phone)
                </Label>
              </div>

              {/* Interactive Preview Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="max-h-[400px] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase sticky top-0 z-10 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Name *</th>
                        <th className="px-4 py-3 font-medium">Class *</th>
                        <th className="px-4 py-3 font-medium">Roll No</th>
                        <th className="px-4 py-3 font-medium">Parent Email</th>
                        <th className="px-4 py-3 font-medium">Parent Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {parsedData.map((row, idx) => {
                        const rowErrs = validationErrors[idx];
                        const hasErr = rowErrs && rowErrs.length > 0;
                        return (
                          <tr key={idx} className={hasErr ? "bg-red-500/5" : "hover:bg-slate-800/20"}>
                            <td className="px-4 py-2">
                              {hasErr ? (
                                <div className="group relative flex items-center justify-center">
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                  <div className="absolute left-6 hidden group-hover:block z-20 w-48 p-2 text-xs bg-slate-800 text-red-400 rounded shadow-lg border border-red-500/20">
                                    {rowErrs.map((e, i) => <div key={i}>• {e}</div>)}
                                  </div>
                                </div>
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              )}
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                value={row.name || ""} 
                                onChange={(e) => handleInlineEdit(idx, "name", e.target.value)}
                                className={`h-8 bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-900 ${!row.name ? 'border-red-500/50 bg-red-500/5' : ''}`}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                value={row.class || ""} 
                                onChange={(e) => handleInlineEdit(idx, "class", e.target.value)}
                                className={`h-8 w-24 bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-900 ${!row.class ? 'border-red-500/50 bg-red-500/5' : ''}`}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                value={row.roll_number || ""} 
                                onChange={(e) => handleInlineEdit(idx, "roll_number", e.target.value)}
                                className="h-8 w-24 bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-900"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                value={row.parent_email || ""} 
                                onChange={(e) => handleInlineEdit(idx, "parent_email", e.target.value)}
                                className="h-8 min-w-[150px] bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-900"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <Input 
                                value={row.parent_phone || ""} 
                                onChange={(e) => handleInlineEdit(idx, "parent_phone", e.target.value)}
                                className="h-8 min-w-[120px] bg-transparent border-transparent hover:border-slate-700 focus:bg-slate-900"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {Object.keys(validationErrors).length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Please resolve {Object.keys(validationErrors).length} rows with validation errors before importing. Hover over the alert icons for details.</span>
                </div>
              )}

              <Button 
                className="w-full h-11" 
                onClick={handleImport}
                disabled={Object.keys(validationErrors).length > 0}
              >
                Start Import ({parsedData.length} students)
              </Button>
            </div>
          )}

          {isImporting && (
            <div className="py-12 space-y-6 text-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
              <div className="space-y-2 max-w-sm mx-auto">
                <h3 className="text-lg font-medium">Importing Students...</h3>
                <p className="text-sm text-slate-400">Please do not close this tab. Processing in batches of 100.</p>
                <Progress value={progress} className="h-2 mt-4" />
                <p className="text-xs text-slate-500 font-mono mt-1">{progress}% Complete</p>
              </div>
            </div>
          )}

          {successResult && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold">Import Complete!</h3>
              <div className="flex items-center justify-center space-x-4">
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
                  {successResult.imported} Created
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-700 bg-slate-800/50 px-3 py-1">
                  {successResult.skipped} Skipped (Duplicates)
                </Badge>
              </div>
              <div className="pt-6">
                <Button variant="outline" onClick={() => { setSuccessResult(null); setFile(null); setParsedData([]); }}>
                  Import More Students
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
