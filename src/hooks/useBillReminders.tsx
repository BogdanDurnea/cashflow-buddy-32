import { useState, useEffect, useCallback } from "react";
import { BillReminder, PaymentRecord } from "@/components/BillReminders";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { toast } from "sonner";

const STORAGE_KEY = "billReminders";

export function useBillReminders() {
  const { user } = useAuth();
  const { checkFeatureAchievement } = useAchievements();
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reminders from localStorage (per user)
  useEffect(() => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    const storageKey = `${STORAGE_KEY}_${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReminders(parsed.map((r: any) => ({
          ...r,
          lastNotified: r.lastNotified ? new Date(r.lastNotified) : undefined,
          paymentHistory: (r.paymentHistory || []).map((p: any) => ({
            ...p,
            paidAt: new Date(p.paidAt),
          })),
        })));
      } catch (error) {
        console.error("Error parsing bill reminders:", error);
      }
    }
    setLoading(false);
  }, [user]);

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    if (!user || loading) return;
    
    const storageKey = `${STORAGE_KEY}_${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(reminders));
  }, [reminders, user, loading]);

  const addReminder = useCallback((reminder: Omit<BillReminder, "id">) => {
    const newReminder: BillReminder = {
      ...reminder,
      id: crypto.randomUUID(),
      paymentHistory: reminder.paymentHistory || [],
    };
    setReminders(prev => [...prev, newReminder]);
    checkFeatureAchievement("first_reminder");
  }, [checkFeatureAchievement]);

  const updateReminder = useCallback((id: string, updates: Partial<BillReminder>) => {
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const markAsPaid = useCallback((reminderId: string, payment: Omit<PaymentRecord, "id">) => {
    const newPayment: PaymentRecord = {
      ...payment,
      id: crypto.randomUUID(),
    };
    
    setReminders(prev => 
      prev.map(r => {
        if (r.id === reminderId) {
          return {
            ...r,
            paymentHistory: [...(r.paymentHistory || []), newPayment],
          };
        }
        return r;
      })
    );
  }, []);

  const getRemindersForTransaction = useCallback((transactionId: string) => {
    return reminders.filter(r => r.recurringTransactionId === transactionId);
  }, [reminders]);

  return {
    reminders,
    loading,
    addReminder,
    updateReminder,
    deleteReminder,
    markAsPaid,
    getRemindersForTransaction,
  };
}