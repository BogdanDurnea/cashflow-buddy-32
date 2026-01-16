import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Paperclip, X, WifiOff, Camera, Image } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { incomeCategories, expenseCategories } from "@/lib/categoryConfig";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useOfflineSync } from "@/hooks/useOfflineSync";

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
  const { isOnline } = useOfflineSync();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
      // Upload attachment if present (only when online)
      if (attachmentFile) {
        if (!isOnline) {
          toast({
            title: "Atașamentele necesită conexiune",
            description: "Tranzacția va fi salvată fără atașament în modul offline.",
            variant: "destructive"
          });
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Nu ești autentificat");

          const fileExt = attachmentFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('receipts')
            .upload(fileName, attachmentFile);

          if (uploadError) throw uploadError;

          // Store the file path (not the URL) - signed URLs will be generated on demand
          attachmentUrl = fileName;
        }
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
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";

      toast({ 
        title: isOnline 
          ? "Tranzacție adăugată cu succes!" 
          : "Tranzacție salvată offline",
        description: !isOnline 
          ? "Va fi sincronizată când revii online." 
          : undefined
      });
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
    <Card className="shadow-card transition-smooth">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <PlusCircle className="h-5 w-5 shrink-0" />
          <span className="truncate">Adaugă tranzacție nouă</span>
          {!isOnline && (
            <span className="ml-auto flex items-center gap-1 text-xs font-normal text-amber-500">
              <WifiOff className="h-3 w-3" />
              Offline
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type" className="text-sm sm:text-base">Tip tranzacție</Label>
            <Select value={type} onValueChange={(value: "income" | "expense") => {
              setType(value);
              setCategory(""); // Reset category when type changes
            }}>
              <SelectTrigger id="type" className="h-11 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income" className="text-base py-3">Venit</SelectItem>
                <SelectItem value="expense" className="text-base py-3">Cheltuială</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="text-sm sm:text-base">Sumă</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-11 text-base"
                required
              />
            </div>
            <div>
              <Label htmlFor="currency" className="text-sm sm:text-base">Valută</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency" className="h-11 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code} className="text-base py-3">
                      {curr.symbol} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category" className="text-sm sm:text-base">Categorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="h-11 text-base">
                <SelectValue placeholder="Selectează categoria" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => {
                  // Handle both LucideIcon components and string icon names
                  const IconComponent = typeof cat.icon === 'string' 
                    ? (LucideIcons as any)[cat.icon] || LucideIcons.Home
                    : cat.icon;
                  
                  return (
                    <SelectItem key={cat.name} value={cat.name} className="py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-1.5 rounded"
                          style={{ 
                            backgroundColor: cat.lightColor,
                            color: cat.color
                          }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="text-base">{cat.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm sm:text-base">Descriere (opțional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descriere tranzacție..."
              rows={2}
              className="text-base resize-none"
            />
          </div>

          <div>
            <Label htmlFor="attachment" className="text-sm sm:text-base">Atașament (opțional)</Label>
            <div className="flex flex-col gap-2">
              {/* Hidden inputs for file selection */}
              <Input
                ref={fileInputRef}
                id="attachment"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Button group for camera and gallery */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 text-base active:scale-95 transition-smooth"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">Fotografiază</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 text-base active:scale-95 transition-smooth"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">Galerie</span>
                </Button>
              </div>

              {/* Selected file preview */}
              {attachmentFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{attachmentFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 active:scale-95 transition-smooth"
                    onClick={() => {
                      setAttachmentFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      if (cameraInputRef.current) cameraInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base transition-spring active:scale-[0.98]"
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