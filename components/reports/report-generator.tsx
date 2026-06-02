"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReportGeneratorProps {
  schoolName: string;
  schoolLogo?: string | null;
  reportName: string;
  description: string;
  fetchData: (startDate?: Date, endDate?: Date) => Promise<any[]>;
  columns: { header: string; key: string }[];
  needsDateRange?: boolean;
}

export function ReportGenerator({
  schoolName,
  schoolLogo,
  reportName,
  description,
  fetchData,
  columns,
  needsDateRange = false
}: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  
  // Default to current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [startDate, setStartDate] = useState<string>(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(now.toISOString().split('T')[0]);

  const generateCSV = async () => {
    try {
      setLoading(true);
      const data = await fetchData(
        needsDateRange && startDate ? new Date(startDate) : undefined,
        needsDateRange && endDate ? new Date(endDate) : undefined
      );
      
      let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
      csvContent += columns.map(c => `"${c.header}"`).join(",") + "\n";
      
      data.forEach(row => {
        const rowData = columns.map(c => {
          let val = row[c.key];
          if (val === null || val === undefined) val = "";
          // Escape quotes
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvContent += rowData.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setLoading(true);
      const data = await fetchData(
        needsDateRange && startDate ? new Date(startDate) : undefined,
        needsDateRange && endDate ? new Date(endDate) : undefined
      );
      
      const doc = new jsPDF("landscape");
      
      // Header
      if (schoolLogo) {
        // Attempt to add logo if it's a valid data URL
        try {
          doc.addImage(schoolLogo, "PNG", 14, 10, 20, 20);
        } catch (e) {
          console.error("Error adding logo", e);
        }
      }

      doc.setFontSize(18);
      doc.text(schoolName, schoolLogo ? 40 : 14, 18);
      doc.setFontSize(12);
      
      let dateRangeStr = `Generated on: ${formatDate(new Date())}`;
      if (needsDateRange && startDate && endDate) {
        dateRangeStr = `Period: ${formatDate(new Date(startDate))} to ${formatDate(new Date(endDate))}`;
      }
      
      doc.text(`${reportName} - ${dateRangeStr}`, schoolLogo ? 40 : 14, 26);

      const tableData = data.map(row => 
        columns.map(c => {
          const val = row[c.key];
          return val !== null && val !== undefined ? String(val) : "";
        })
      );

      autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: tableData,
        startY: 35,
        styles: { font: "helvetica" },
        headStyles: { fillColor: [0, 51, 102] }
      });

      doc.save(`${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {needsDateRange && (
        <div className="flex items-center gap-2 text-sm">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <span className="text-muted-foreground">to</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-transparent flex-1"
          onClick={generateCSV}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          CSV
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 bg-transparent flex-1"
          onClick={generatePDF}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          PDF
        </Button>
      </div>
    </div>
  );
}
