import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/components/TransactionForm";

interface ImportDataProps {
  onImport: (transactions: Transaction[]) => void;
}

export function ImportData({ onImport }: ImportDataProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const parseCSV = (text: string): Transaction[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error("Fișier CSV invalid");

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const transactions: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const typeIdx = headers.findIndex(h => h.includes('tip') || h.includes('type'));
      const amountIdx = headers.findIndex(h => h.includes('suma') || h.includes('amount'));
      const categoryIdx = headers.findIndex(h => h.includes('categorie') || h.includes('category'));
      const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
      const descIdx = headers.findIndex(h => h.includes('descriere') || h.includes('description'));

      if (typeIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
        continue;
      }

      const type = values[typeIdx]?.toLowerCase();
      if (type !== 'income' && type !== 'expense' && type !== 'venit' && type !== 'cheltuiala') {
        continue;
      }

      transactions.push({
        id: `import-${Date.now()}-${i}`,
        type: (type === 'income' || type === 'venit') ? 'income' : 'expense',
        amount: parseFloat(values[amountIdx]) || 0,
        category: values[categoryIdx] || 'Altele',
        date: dateIdx !== -1 ? new Date(values[dateIdx]) : new Date(),
        description: descIdx !== -1 ? values[descIdx] : '',
        currency: 'RON',
        exchange_rate: 1
      });
    }

    return transactions;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Format invalid",
        description: "Te rog să încarci un fișier CSV.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        throw new Error("Nu s-au găsit tranzacții valide în fișier");
      }

      onImport(transactions);
      setImportedCount(transactions.length);
      
      toast({
        title: "Import reușit!",
        description: `${transactions.length} tranzacții au fost importate.`,
      });
    } catch (error) {
      toast({
        title: "Eroare la import",
        description: error instanceof Error ? error.message : "Fișier CSV invalid",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle>Importă Date</CardTitle>
        </div>
        <CardDescription>
          Importă tranzacții din fișiere CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-4">
          <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <div className="text-sm font-medium mb-1">
                Selectează fișier CSV
              </div>
              <div className="text-xs text-muted-foreground">
                Formatele acceptate: tip, suma, categorie, data, descriere
              </div>
            </Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
          </div>
          <Button
            onClick={() => document.getElementById('csv-upload')?.click()}
            disabled={isProcessing}
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? "Se procesează..." : "Alege Fișier"}
          </Button>
        </div>

        {importedCount !== null && (
          <div className="flex items-center gap-2 p-3 bg-success-light text-success rounded-lg">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">
              {importedCount} tranzacții importate cu succes
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span>Format CSV</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 pl-6">
            <p>• Prima linie trebuie să conțină headerele coloanelor</p>
            <p>• Coloane necesare: tip, suma, categorie</p>
            <p>• Coloane opționale: data, descriere</p>
            <p>• Tip: "income" sau "expense" (sau "venit", "cheltuiala")</p>
            <p>• Exemplu: tip,suma,categorie,data,descriere</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
