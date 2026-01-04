import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, UserPlus, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SharedBudget {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  month: number;
  year: number;
  amount: number;
  role?: string;
}

interface BudgetMember {
  id: string;
  user_id: string;
  role: string;
  email?: string;
}

export function SharedBudgetsManager() {
  const [sharedBudgets, setSharedBudgets] = useState<SharedBudget[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [members, setMembers] = useState<BudgetMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
  });

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("viewer");

  useEffect(() => {
    loadSharedBudgets();
  }, []);

  useEffect(() => {
    if (selectedBudget) {
      loadMembers(selectedBudget);
    }
  }, [selectedBudget]);

  const loadSharedBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from("shared_budgets")
        .select(`
          *,
          shared_budget_members!inner(role)
        `);

      if (error) throw error;

      const budgetsWithRole = data?.map((budget: any) => ({
        ...budget,
        role: budget.shared_budget_members?.[0]?.role || "viewer",
      })) || [];

      setSharedBudgets(budgetsWithRole);
    } catch (error: any) {
      console.error("Error loading shared budgets:", error);
    }
  };

  const loadMembers = async (budgetId: string) => {
    try {
      const { data, error } = await supabase
        .from("shared_budget_members")
        .select("*")
        .eq("shared_budget_id", budgetId);

      if (error) throw error;

      // Fetch emails from profiles separately
      const membersWithEmails = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", member.user_id)
            .single();
          
          return { ...member, email: profile?.email || "Utilizator" };
        })
      );

      setMembers(membersWithEmails);
    } catch (error: any) {
      console.error("Error loading members:", error);
    }
  };

  const createSharedBudget = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: budget, error: budgetError } = await supabase
        .from("shared_budgets")
        .insert({
          ...formData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // Add owner as member
      const { error: memberError } = await supabase
        .from("shared_budget_members")
        .insert({
          shared_budget_id: budget.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast({
        title: "✓ Budget partajat creat",
        description: "Poți adăuga membri acum",
      });

      setOpen(false);
      setFormData({ name: "", description: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0 });
      loadSharedBudgets();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!selectedBudget || !memberEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberEmail.trim())) {
      toast({
        title: "Eroare",
        description: "Adresa de email nu este validă",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find user by email - use generic error message to prevent email enumeration
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", memberEmail.trim().toLowerCase())
        .single();

      // Insert member if user exists
      if (!profileError && profileData) {
        const { error } = await supabase
          .from("shared_budget_members")
          .insert({
            shared_budget_id: selectedBudget,
            user_id: profileData.id,
            role: memberRole,
          });

        if (error) {
          // Check for duplicate member
          if (error.code === '23505') {
            toast({
              title: "Eroare",
              description: "Acest utilizator este deja membru",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "✓ Invitație trimisă",
          description: "Dacă utilizatorul există, a fost adăugat la budget",
        });
      } else {
        // Return same generic message regardless of whether user exists
        // This prevents email enumeration attacks
        toast({
          title: "✓ Invitație trimisă",
          description: "Dacă utilizatorul există, a fost adăugat la budget",
        });
      }

      setMemberEmail("");
      setMemberRole("viewer");
      loadMembers(selectedBudget);
    } catch (error: any) {
      // Generic error message to prevent information leakage
      toast({
        title: "Eroare",
        description: "Nu s-a putut procesa cererea. Încearcă din nou.",
        variant: "destructive",
      });
      console.error("Error adding member:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("shared_budget_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "✓ Membru eliminat",
      });

      if (selectedBudget) loadMembers(selectedBudget);
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteSharedBudget = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from("shared_budgets")
        .delete()
        .eq("id", budgetId);

      if (error) throw error;

      toast({
        title: "✓ Budget șters",
      });

      loadSharedBudgets();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bugete Partajate
            </CardTitle>
            <CardDescription>
              Colaborează cu alții la gestionarea bugetelor
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Crează Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Budget Partajat Nou</DialogTitle>
                <DialogDescription>
                  Creează un budget pe care îl poți partaja cu alții
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nume</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Budget familie"
                  />
                </div>
                <div>
                  <Label>Descriere</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalii despre budget"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Luna</Label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>An</Label>
                    <Input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Sumă (RON)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  />
                </div>
                <Button onClick={createSharedBudget} disabled={loading} className="w-full">
                  {loading ? "Se creează..." : "Creează Budget"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sharedBudgets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nu ai bugete partajate încă
            </p>
          ) : (
            sharedBudgets.map((budget) => (
              <div key={budget.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{budget.name}</h4>
                      <Badge variant="outline">{budget.role}</Badge>
                    </div>
                    {budget.description && (
                      <p className="text-sm text-muted-foreground">{budget.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>Perioada: {budget.month}/{budget.year}</span>
                      <span>Sumă: {budget.amount.toFixed(2)} RON</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {budget.role === "owner" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBudget(budget.id);
                            setMembersOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteSharedBudget(budget.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gestionează Membri</DialogTitle>
              <DialogDescription>
                Adaugă sau elimină persoane din acest budget
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Email utilizator"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                  />
                </div>
                <Select value={memberRole} onValueChange={setMemberRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addMember} disabled={loading}>
                  <Mail className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{member.email}</div>
                      <Badge variant="secondary" className="text-xs">{member.role}</Badge>
                    </div>
                    {member.role !== "owner" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
