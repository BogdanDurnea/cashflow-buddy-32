import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Paperclip, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { incomeCategories, expenseCategories } from "@/lib/categoryConfig";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: Date;
  currency?: string;
  exchange_rate?: number;
  attachment_url?: string;
}

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}


const CURRENCIES = [
  { code: "RON", symbol: "RON", rate: 1 },
  { code: "EUR", symbol: "€", rate: 4.98 },
  { code: "USD", symbol: "$", rate: 4.57 },
  { code: "GBP", symbol: "£", rate: 5.76 }
];

export function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: customCategories = [] } = useQuery({
    queryKey: ["custom-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_categories")
        .select("*")
        .eq("type", type);
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    setIsUploading(true);
    let attachmentUrl = null;

    try {
      // Upload attachment if present
      if (attachmentFile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Nu ești autentificat");

        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, attachmentFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
      }

      const selectedCurrency = CURRENCIES.find(c => c.code === currency);
      
      onAddTransaction({
        type,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(),
        currency: currency,
        exchange_rate: selectedCurrency?.rate || 1,
        attachment_url: attachmentUrl || undefined
      });

      // Reset form
      setAmount("");
      setCategory("");
      setDescription("");
      setCurrency("RON");
      setAttachmentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({ title: "Tranzacție adăugată cu succes!" });
    } catch (error) {
      console.error("Error:", error);
      toast({ 
        title: "Eroare la adăugarea tranzacției", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ 
          title: "Fișierul este prea mare", 
          description: "Dimensiunea maximă este 5MB",
          variant: "destructive" 
        });
        return;
      }
      setAttachmentFile(file);
    }
  };

  const defaultCategories = type === "income" ? incomeCategories : expenseCategories;
  const allCategories = [
    ...defaultCategories,
    ...customCategories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      color: cat.color || "#3b82f6",
      lightColor: cat.color ? `${cat.color}20` : "#3b82f620"
    }))
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Adaugă tranzacție nouă
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Tip tranzacție</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => {
              setType(value);
              setCategory(""); // Reset category when type changes
            }}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Venit</SelectItem>
                <SelectItem value="expense">Cheltuială</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Sumă</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Valută</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selectează categoria" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => {
                  // Handle both LucideIcon components and string icon names
                  const IconComponent = typeof cat.icon === 'string' 
                    ? (LucideIcons as any)[cat.icon] || LucideIcons.Home
                    : cat.icon;
                  
                  return (
                    <SelectItem key={cat.name} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-1 rounded"
                          style={{ 
                            backgroundColor: cat.lightColor,
                            color: cat.color
                          }}
                        >
                          <IconComponent className="h-3 w-3" />
                        </div>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descriere (opțional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descriere tranzacție..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="attachment">Atașament (opțional)</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="attachment"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                {attachmentFile ? attachmentFile.name : "Adaugă chitanță"}
              </Button>
              {attachmentFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAttachmentFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full transition-spring"
            variant={type === "income" ? "success" : "danger"}
            disabled={isUploading}
          >
            {isUploading ? "Se încarcă..." : `Adaugă ${type === "income" ? "venit" : "cheltuială"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}