import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Mail, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/components/TransactionForm";

interface ShareReportProps {
  transactions: Transaction[];
}

export function ShareReport({ transactions }: ShareReportProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");

  const generateSummary = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    return `📊 Raport Financiar MoneyTracker

💰 Venituri Totale: ${totalIncome.toFixed(2)} RON
💸 Cheltuieli Totale: ${totalExpense.toFixed(2)} RON
📈 Sold: ${balance.toFixed(2)} RON

Număr tranzacții: ${transactions.length}
Genererat: ${new Date().toLocaleDateString('ro-RO')}`;
  };

  const handleCopyToClipboard = () => {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copiat!",
      description: "Raportul a fost copiat în clipboard.",
    });
  };

  const handleShareByEmail = () => {
    if (!email) {
      toast({
        title: "Email lipsă",
        description: "Te rog să introduci o adresă de email.",
        variant: "destructive",
      });
      return;
    }

    const summary = generateSummary();
    const subject = encodeURIComponent("Raport Financiar MoneyTracker");
    const body = encodeURIComponent(summary);
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    toast({
      title: "Email pregătit",
      description: "Clientul tău de email s-a deschis.",
    });
  };

  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <CardTitle>Partajează Raport</CardTitle>
        </div>
        <CardDescription>
          Trimite un rezumat financiar prin email sau copiază-l
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p className="font-medium">📊 Rezumat:</p>
          <p className="text-muted-foreground whitespace-pre-line">{generateSummary()}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="share-email" className="text-sm">Trimite prin Email</Label>
          <div className="flex gap-2">
            <Input
              id="share-email"
              type="email"
              placeholder="adresa@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleShareByEmail} variant="outline" className="shrink-0">
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleCopyToClipboard} 
          className="w-full transition-spring"
          variant={copied ? "outline" : "default"}
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Copiat!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiază în Clipboard
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
