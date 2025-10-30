import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, FileSpreadsheet, Filter } from "lucide-react";
import { Transaction } from "@/components/TransactionForm";
import { toast } from "sonner";
import { expenseCategories, incomeCategories } from "@/lib/categoryConfig";

interface ExportDataProps {
  transactions: Transaction[];
}

export function ExportData({ transactions }: ExportDataProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<"csv" | "pdf">("csv");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpense, setIncludeExpense] = useState(true);

  const allCategories = [
    ...expenseCategories.map(c => c.name),
    ...incomeCategories.map(c => c.name)
  ];

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      if (!includeIncome && t.type === "income") return false;
      if (!includeExpense && t.type === "expense") return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
      return true;
    });
  };
  
  const exportToCSV = (filtered = false) => {
    const dataToExport = filtered ? getFilteredTransactions() : transactions;
    
    if (dataToExport.length === 0) {
      toast.error("Nu există tranzacții de exportat");
      return;
    }

    // CSV Header
    const headers = ["Data", "Tip", "Categorie", "Sumă (RON)", "Descriere"];
    
    // CSV Rows
    const rows = dataToExport.map(t => [
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
    const filename = filtered ? `tranzactii_filtrate_${new Date().toISOString().split('T')[0]}.csv` : `tranzactii_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Date exportate cu succes în CSV");
  };

  const exportToPDF = async (filtered = false) => {
    const dataToExport = filtered ? getFilteredTransactions() : transactions;
    
    if (dataToExport.length === 0) {
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
      const totalIncome = dataToExport.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = dataToExport.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
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
      dataToExport.forEach(t => {
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
      const filename = filtered ? `tranzactii_filtrate_${new Date().toISOString().split('T')[0]}.pdf` : `tranzactii_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success("Date exportate cu succes în PDF");
    } catch (error) {
      toast.error("Eroare la exportul PDF");
      console.error(error);
    }
  };

  const handleExportWithFilters = () => {
    if (exportType === "csv") {
      exportToCSV(true);
    } else {
      exportToPDF(true);
    }
    setIsFilterDialogOpen(false);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            onClick={() => exportToCSV(false)}
            variant="outline"
            className="w-full"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          
          <Button 
            onClick={() => exportToPDF(false)}
            variant="outline"
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>

          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Export cu Filtre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configurare Export</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Format Export</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={exportType === "csv" ? "default" : "outline"}
                      onClick={() => setExportType("csv")}
                      className="flex-1"
                    >
                      CSV
                    </Button>
                    <Button
                      variant={exportType === "pdf" ? "default" : "outline"}
                      onClick={() => setExportType("pdf")}
                      className="flex-1"
                    >
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tip Tranzacții</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="income"
                        checked={includeIncome}
                        onCheckedChange={(checked) => setIncludeIncome(checked as boolean)}
                      />
                      <label htmlFor="income" className="text-sm cursor-pointer">
                        Venituri
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="expense"
                        checked={includeExpense}
                        onCheckedChange={(checked) => setIncludeExpense(checked as boolean)}
                      />
                      <label htmlFor="expense" className="text-sm cursor-pointer">
                        Cheltuieli
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categorii (opțional)</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {allCategories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <label htmlFor={`cat-${category}`} className="text-sm cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategories([])}
                      className="w-full"
                    >
                      Resetează categorii
                    </Button>
                  )}
                </div>

                <Button onClick={handleExportWithFilters} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportă {getFilteredTransactions().length} tranzacții
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
