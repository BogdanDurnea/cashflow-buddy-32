import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";

interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  type: "income" | "expense";
  color?: string;
}

const availableIcons = [
  "Home", "Car", "ShoppingBag", "Coffee", "Utensils", "Plane", "Heart",
  "Gift", "Book", "Music", "Gamepad2", "Dumbbell", "Briefcase", "GraduationCap",
  "Stethoscope", "Shirt", "Smartphone", "Laptop", "Wifi", "Zap"
];

const availableColors = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"
];

export function CustomCategoriesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "Home",
    type: "expense" as "income" | "expense",
    color: "#3b82f6"
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["custom-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_categories")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomCategory[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (category: Omit<CustomCategory, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nu ești autentificat");

      const { error } = await supabase
        .from("custom_categories")
        .insert({ ...category, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-categories"] });
      toast({ title: "Categorie creată cu succes!" });
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      toast({ title: "Eroare la crearea categoriei", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...category }: CustomCategory) => {
      const { error } = await supabase
        .from("custom_categories")
        .update(category)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-categories"] });
      toast({ title: "Categorie actualizată cu succes!" });
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      toast({ title: "Eroare la actualizarea categoriei", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-categories"] });
      toast({ title: "Categorie ștearsă cu succes!" });
    },
    onError: () => {
      toast({ title: "Eroare la ștergerea categoriei", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ name: "", icon: "Home", type: "expense", color: "#3b82f6" });
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: "Te rog introdu un nume", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ ...editingCategory, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: CustomCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      type: category.type,
      color: category.color || "#3b82f6"
    });
    setIsOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : <LucideIcons.Home className="h-5 w-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Categorii Personalizate</CardTitle>
            <CardDescription>Creează și gestionează categoriile tale proprii</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adaugă Categorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editează Categoria" : "Categorie Nouă"}
                </DialogTitle>
                <DialogDescription>
                  Creează o categorie personalizată pentru tranzacțiile tale
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nume</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Abonament Sală"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{formData.name.length}/100</p>
                </div>

                <div>
                  <Label htmlFor="type">Tip</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "income" | "expense") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Cheltuială</SelectItem>
                      <SelectItem value="income">Venit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="icon">Iconiță</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIcons.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            {getIconComponent(icon)}
                            {icon}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Culoare</Label>
                  <div className="grid grid-cols-9 gap-2 mt-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          formData.color === color ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingCategory ? "Actualizează" : "Creează"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      resetForm();
                    }}
                  >
                    Anulează
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Se încarcă...</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nu ai categorii personalizate. Creează prima ta categorie!
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                style={{ borderLeftColor: category.color, borderLeftWidth: "4px" }}
              >
                <div className="flex items-center gap-2">
                  <div style={{ color: category.color }}>
                    {getIconComponent(category.icon)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.type === "income" ? "Venit" : "Cheltuială"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
