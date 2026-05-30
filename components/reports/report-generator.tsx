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
  fetchData: () => Promise<any[]>;
  columns: { header: string; key: string }[];
}

export function ReportGenerator({
  schoolName,
  schoolLogo,
  reportName,
  description,
  fetchData,
  columns
}: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const generateCSV = async () => {
    try {
      setLoading(true);
      const data = await fetchData();
      
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
      const data = await fetchData();
      
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
      const dateRange = `Generated on: ${formatDate(new Date())}`; // Added date range per requirements
      doc.text(`${reportName} - ${dateRange}`, schoolLogo ? 40 : 14, 26);

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
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 bg-transparent"
        onClick={generateCSV}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        CSV
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 bg-transparent"
        onClick={generatePDF}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        PDF
      </Button>
    </div>
  );
}
