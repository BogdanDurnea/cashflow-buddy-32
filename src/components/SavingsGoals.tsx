import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Target, Plus, Trash2, PiggyBank, CalendarIcon, TrendingUp } from "lucide-react";
import { SavingsGoal } from "@/hooks/useSavingsGoals";
import { format, differenceInDays } from "date-fns";
import { ro } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, "id" | "createdAt" | "color">) => void;
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onAddToGoal: (id: string, amount: number) => void;
}

export function SavingsGoals({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddToGoal,
}: SavingsGoalsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddAmountDialogOpen, setIsAddAmountDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  
  // Form state
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState("");

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setDeadline(undefined);
    setCategory("");
  };

  const handleSubmit = () => {
    if (!name || !targetAmount || !deadline) {
      toast.error("Te rog completează toate câmpurile obligatorii");
      return;
    }

    onAddGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      deadline,
      category: category || "General",
    });

    toast.success("Obiectiv de economii adăugat!");
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleAddAmount = () => {
    if (!selectedGoalId || !addAmount) return;
    
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Te rog introdu o sumă validă");
      return;
    }

    onAddToGoal(selectedGoalId, amount);
    toast.success(`+${amount.toFixed(2)} RON adăugat la obiectiv!`);
    setAddAmount("");
    setIsAddAmountDialogOpen(false);
    setSelectedGoalId(null);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-success";
    if (progress >= 75) return "bg-primary";
    if (progress >= 50) return "bg-warning";
    return "bg-muted-foreground";
  };

  const getDaysRemaining = (deadline: Date) => {
    const days = differenceInDays(deadline, new Date());
    if (days < 0) return "Expirat";
    if (days === 0) return "Azi";
    if (days === 1) return "Mâine";
    return `${days} zile`;
  };

  return (
    <Card className="hover-card-scale">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Obiective de Economii
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Adaugă
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Obiectiv Nou de Economii</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Nume obiectiv *</Label>
                <Input
                  id="goal-name"
                  placeholder="ex: Vacanță în Grecia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-amount">Sumă țintă (RON) *</Label>
                <Input
                  id="target-amount"
                  type="number"
                  placeholder="5000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP", { locale: ro }) : "Selectează data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categorie</Label>
                <Input
                  id="category"
                  placeholder="ex: Vacanță, Mașină, Casă"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Anulează
                </Button>
                <Button className="flex-1" onClick={handleSubmit}>
                  Salvează
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Niciun obiectiv de economii</p>
            <p className="text-sm">Adaugă primul tău obiectiv!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {goals.map((goal, index) => {
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const daysRemaining = getDaysRemaining(goal.deadline);
                const isCompleted = progress >= 100;
                const isExpired = differenceInDays(goal.deadline, new Date()) < 0;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border bg-card/50 space-y-3",
                      isCompleted && "border-success/50 bg-success/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: goal.color }}
                          />
                          <h4 className="font-medium">{goal.name}</h4>
                          {isCompleted && (
                            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                              Completat!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{goal.category}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setIsAddAmountDialogOpen(true);
                          }}
                          disabled={isCompleted}
                        >
                          <TrendingUp className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            onDeleteGoal(goal.id);
                            toast.success("Obiectiv șters");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progres</span>
                        <span className="font-medium">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="relative">
                        <Progress value={progress} className="h-2" />
                        <div
                          className={cn(
                            "absolute top-0 left-0 h-2 rounded-full transition-all",
                            getProgressColor(progress)
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-semibold text-primary">
                          {goal.currentAmount.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}/ {goal.targetAmount.toFixed(2)} RON
                        </span>
                      </div>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        isExpired && !isCompleted 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <CalendarIcon className="h-3 w-3 inline mr-1" />
                        {daysRemaining}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Add Amount Dialog */}
        <Dialog open={isAddAmountDialogOpen} onOpenChange={setIsAddAmountDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adaugă la Obiectiv</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="add-amount">Sumă (RON)</Label>
                <Input
                  id="add-amount"
                  type="number"
                  placeholder="100"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => {
                    setIsAddAmountDialogOpen(false);
                    setAddAmount("");
                  }}
                >
                  Anulează
                </Button>
                <Button className="flex-1" onClick={handleAddAmount}>
                  Adaugă
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
