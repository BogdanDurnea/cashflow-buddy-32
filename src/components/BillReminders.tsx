import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Plus, Trash2, Clock, AlertTriangle, Check, Calendar, CheckCircle2, History, Receipt } from "lucide-react";
import { RecurringTransaction } from "@/components/RecurringTransactions";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { format, addDays, differenceInDays, isBefore, isToday } from "date-fns";
import { ro } from "date-fns/locale";

export interface PaymentRecord {
  id: string;
  reminderId: string;
  paidAt: Date;
  amount: number;
  description: string;
  category: string;
}

export interface BillReminder {
  id: string;
  recurringTransactionId: string;
  reminderDays: number;
  isEnabled: boolean;
  lastNotified?: Date;
  paymentHistory: PaymentRecord[];
}

interface BillRemindersProps {
  recurringTransactions: RecurringTransaction[];
  reminders: BillReminder[];
  onAddReminder: (reminder: Omit<BillReminder, "id">) => void;
  onUpdateReminder: (id: string, updates: Partial<BillReminder>) => void;
  onDeleteReminder: (id: string) => void;
  onMarkAsPaid: (reminderId: string, payment: Omit<PaymentRecord, "id">) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -10 }
};

export function BillReminders({
  recurringTransactions,
  reminders,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onMarkAsPaid,
}: BillRemindersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string>("");
  const [reminderDays, setReminderDays] = useState<string>("3");
  const [activeTab, setActiveTab] = useState("reminders");
  const { permission, requestPermission, sendNotification } = usePushNotifications();

  // Get all payment history across all reminders
  const allPaymentHistory = reminders
    .flatMap(r => r.paymentHistory || [])
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  // Get expense transactions only (bills are usually expenses)
  const expenseTransactions = recurringTransactions.filter(t => t.type === "expense" && t.isActive);

  // Get transactions that don't have reminders yet
  const availableTransactions = expenseTransactions.filter(
    t => !reminders.some(r => r.recurringTransactionId === t.id)
  );

  // Check for upcoming bills and send notifications
  useEffect(() => {
    if (permission !== "granted") return;

    const checkReminders = () => {
      reminders.forEach(reminder => {
        if (!reminder.isEnabled) return;

        const transaction = recurringTransactions.find(t => t.id === reminder.recurringTransactionId);
        if (!transaction || !transaction.isActive) return;

        const daysUntilDue = differenceInDays(new Date(transaction.nextDate), new Date());
        
        // Check if we should send a reminder
        if (daysUntilDue <= reminder.reminderDays && daysUntilDue >= 0) {
          // Don't notify if we already notified today
          if (reminder.lastNotified && isToday(new Date(reminder.lastNotified))) {
            return;
          }

          let message = "";
          if (daysUntilDue === 0) {
            message = `Factura "${transaction.description || transaction.category}" de ${transaction.amount} RON este scadentă AZI!`;
          } else if (daysUntilDue === 1) {
            message = `Factura "${transaction.description || transaction.category}" de ${transaction.amount} RON este scadentă MÂINE!`;
          } else {
            message = `Factura "${transaction.description || transaction.category}" de ${transaction.amount} RON scade în ${daysUntilDue} zile.`;
          }

          sendNotification("📅 Reminder Factură", {
            body: message,
            tag: `bill-reminder-${reminder.id}`,
            requireInteraction: daysUntilDue <= 1,
          });

          onUpdateReminder(reminder.id, { lastNotified: new Date() });
        }
      });
    };

    // Check immediately and then every hour
    checkReminders();
    const interval = setInterval(checkReminders, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [reminders, recurringTransactions, permission, sendNotification, onUpdateReminder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTransaction) {
      toast.error("Selectează o tranzacție recurentă");
      return;
    }

    if (permission !== "granted") {
      requestPermission().then(granted => {
        if (granted) {
          addReminder();
        }
      });
    } else {
      addReminder();
    }
  };

  const addReminder = () => {
    onAddReminder({
      recurringTransactionId: selectedTransaction,
      reminderDays: parseInt(reminderDays),
      isEnabled: true,
      paymentHistory: [],
    });

    setSelectedTransaction("");
    setReminderDays("3");
    setIsOpen(false);
    toast.success("Reminder adăugat cu succes!");
  };

  const handleMarkAsPaid = (reminder: BillReminder) => {
    const transaction = getTransactionForReminder(reminder);
    if (!transaction) return;

    onMarkAsPaid(reminder.id, {
      reminderId: reminder.id,
      paidAt: new Date(),
      amount: transaction.amount,
      description: transaction.description || transaction.category,
      category: transaction.category,
    });

    toast.success("Factură marcată ca plătită!");
  };

  const getTransactionForReminder = (reminder: BillReminder) => {
    return recurringTransactions.find(t => t.id === reminder.recurringTransactionId);
  };

  const getReminderStatus = (reminder: BillReminder) => {
    const transaction = getTransactionForReminder(reminder);
    if (!transaction) return { status: "inactive", label: "Inactiv", color: "secondary" };

    const daysUntilDue = differenceInDays(new Date(transaction.nextDate), new Date());

    if (daysUntilDue < 0) {
      return { status: "overdue", label: "Întârziat", color: "destructive" };
    } else if (daysUntilDue === 0) {
      return { status: "today", label: "Scadent azi", color: "destructive" };
    } else if (daysUntilDue <= reminder.reminderDays) {
      return { status: "upcoming", label: `În ${daysUntilDue} zile`, color: "warning" };
    }
    return { status: "ok", label: `În ${daysUntilDue} zile`, color: "default" };
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Reminder-e Facturi</span>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={allPaymentHistory.length === 0}>
                  <History className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Istoric Plăți
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                  {allPaymentHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nicio plată înregistrată încă.
                    </p>
                  ) : (
                    <motion.div 
                      className="space-y-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } }
                      }}
                    >
                      {allPaymentHistory.map((payment, index) => {
                        const config = getCategoryConfig(payment.category, "expense");
                        const Icon = config.icon;
                        return (
                          <motion.div
                            key={payment.id}
                            variants={itemVariants}
                            className="p-3 rounded-lg border bg-success/5 border-success/20"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: config.lightColor }}
                              >
                                <Icon className="h-4 w-4" style={{ color: config.color }} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{payment.description}</span>
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(payment.paidAt), "d MMMM yyyy, HH:mm", { locale: ro })}
                                </p>
                              </div>
                              <span className="font-bold text-success">
                                {payment.amount.toFixed(2)} RON
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </ScrollArea>
                {allPaymentHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total plătit</span>
                      <span className="font-bold text-success">
                        {allPaymentHistory.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} RON
                      </span>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={availableTransactions.length === 0}>
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adaugă Reminder Factură</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction">Tranzacție Recurentă</Label>
                    <Select value={selectedTransaction} onValueChange={setSelectedTransaction}>
                      <SelectTrigger id="transaction">
                        <SelectValue placeholder="Selectează factura" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTransactions.map((t) => {
                          const config = getCategoryConfig(t.category, t.type);
                          const Icon = config.icon;
                          return (
                            <SelectItem key={t.id} value={t.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" style={{ color: config.color }} />
                                <span>{t.description || t.category}</span>
                                <span className="text-muted-foreground">({t.amount} RON)</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder-days">Reamintește cu câte zile înainte</Label>
                    <Select value={reminderDays} onValueChange={setReminderDays}>
                      <SelectTrigger id="reminder-days">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 zi înainte</SelectItem>
                        <SelectItem value="2">2 zile înainte</SelectItem>
                        <SelectItem value="3">3 zile înainte</SelectItem>
                        <SelectItem value="5">5 zile înainte</SelectItem>
                        <SelectItem value="7">7 zile înainte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {permission !== "granted" && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Notificările trebuie activate pentru reminder-e
                      </p>
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    Adaugă Reminder
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenseTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Adaugă mai întâi tranzacții recurente pentru a configura reminder-e
          </p>
        ) : reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Niciun reminder configurat. Adaugă unul pentru a primi notificări.
          </p>
        ) : (
          <motion.div 
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
          >
            <AnimatePresence mode="popLayout">
              {reminders.map((reminder) => {
                const transaction = getTransactionForReminder(reminder);
                if (!transaction) return null;

                const config = getCategoryConfig(transaction.category, transaction.type);
                const Icon = config.icon;
                const status = getReminderStatus(reminder);

                return (
                  <motion.div
                    key={reminder.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className={`p-3 rounded-lg border transition-all ${
                      reminder.isEnabled ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: config.lightColor }}
                        >
                          <Icon className="h-4 w-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">
                              {transaction.description || transaction.category}
                            </span>
                            <Badge 
                              variant={
                                status.color === "destructive" ? "destructive" : 
                                status.color === "warning" ? "secondary" : 
                                "outline"
                              }
                              className={status.color === "warning" ? "bg-warning/20 text-warning-foreground border-warning/30" : ""}
                            >
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>Reamintește cu {reminder.reminderDays} zile înainte</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Scadență: {format(new Date(transaction.nextDate), "d MMMM yyyy", { locale: ro })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-danger">
                            {transaction.amount.toFixed(2)} RON
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/30 hover:bg-success/10"
                          onClick={() => handleMarkAsPaid(reminder)}
                          title="Marchează ca plătită"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={reminder.isEnabled}
                          onCheckedChange={(checked) => 
                            onUpdateReminder(reminder.id, { isEnabled: checked })
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteReminder(reminder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Upcoming bills summary */}
        {reminders.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <UpcomingBillsSummary reminders={reminders} recurringTransactions={recurringTransactions} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingBillsSummary({ 
  reminders, 
  recurringTransactions 
}: { 
  reminders: BillReminder[]; 
  recurringTransactions: RecurringTransaction[] 
}) {
  const upcomingBills = reminders
    .filter(r => r.isEnabled)
    .map(reminder => {
      const transaction = recurringTransactions.find(t => t.id === reminder.recurringTransactionId);
      if (!transaction) return null;
      const daysUntilDue = differenceInDays(new Date(transaction.nextDate), new Date());
      return { reminder, transaction, daysUntilDue };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter(item => item.daysUntilDue <= 7 && item.daysUntilDue >= 0)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const totalUpcoming = upcomingBills.reduce((sum, item) => sum + item.transaction.amount, 0);

  if (upcomingBills.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <Check className="h-4 w-4" />
        <span>Nicio factură scadentă în următoarele 7 zile</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Facturi scadente în 7 zile
        </span>
        <span className="text-sm font-bold text-danger">
          {totalUpcoming.toFixed(2)} RON
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        {upcomingBills.length} {upcomingBills.length === 1 ? 'factură' : 'facturi'} de plătit
      </div>
    </div>
  );
}