import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Transaction } from "@/components/TransactionForm";
import { toast } from "sonner";

interface ExportDataProps {
  transactions: Transaction[];
}

export function ExportData({ transactions }: ExportDataProps) {
  
  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error("Nu există tranzacții de exportat");
      return;
    }

    // CSV Header
    const headers = ["Data", "Tip", "Categorie", "Sumă (RON)", "Descriere"];
    
    // CSV Rows
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('ro-RO'),
      t.type === "income" ? "Venit" : "Cheltuială",
      t.category,
      t.amount.toFixed(2),
      t.description || "-"
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `tranzactii_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Date exportate cu succes în CSV");
  };

  const exportToPDF = async () => {
    if (transactions.length === 0) {
      toast.error("Nu există tranzacții de exportat");
      return;
    }

    try {
      // Dynamic import of jsPDF
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text("Raport Tranzacții MoneyTracker", 14, 20);
      
      // Date
      doc.setFontSize(10);
      doc.text(`Generat la: ${new Date().toLocaleDateString('ro-RO')}`, 14, 28);
      
      // Statistics
      const totalIncome = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;
      
      doc.setFontSize(12);
      doc.text("Rezumat:", 14, 38);
      doc.setFontSize(10);
      doc.text(`Total Venituri: ${totalIncome.toFixed(2)} RON`, 14, 45);
      doc.text(`Total Cheltuieli: ${totalExpense.toFixed(2)} RON`, 14, 52);
      doc.text(`Sold: ${balance.toFixed(2)} RON`, 14, 59);
      
      // Transactions table header
      let yPosition = 70;
      doc.setFontSize(12);
      doc.text("Tranzacții:", 14, yPosition);
      yPosition += 7;
      
      // Table header
      doc.setFontSize(9);
      doc.text("Data", 14, yPosition);
      doc.text("Tip", 40, yPosition);
      doc.text("Categorie", 70, yPosition);
      doc.text("Sumă (RON)", 110, yPosition);
      doc.text("Descriere", 150, yPosition);
      yPosition += 5;
      
      // Draw line
      doc.line(14, yPosition, 196, yPosition);
      yPosition += 5;
      
      // Transactions data
      doc.setFontSize(8);
      transactions.forEach(t => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(new Date(t.date).toLocaleDateString('ro-RO'), 14, yPosition);
        doc.text(t.type === "income" ? "Venit" : "Chelt.", 40, yPosition);
        doc.text(t.category.substring(0, 15), 70, yPosition);
        doc.text(t.amount.toFixed(2), 110, yPosition);
        doc.text((t.description || "-").substring(0, 20), 150, yPosition);
        yPosition += 6;
      });
      
      // Save PDF
      doc.save(`tranzactii_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Date exportate cu succes în PDF");
    } catch (error) {
      toast.error("Eroare la exportul PDF");
      console.error(error);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export Date
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Exportă toate tranzacțiile în format CSV sau PDF pentru o analiză mai detaliată.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            onClick={exportToCSV}
            variant="outline"
            className="w-full"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button 
            onClick={exportToPDF}
            variant="outline"
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Total tranzacții:</strong> {transactions.length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
