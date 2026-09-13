import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import type { RecurringTransaction } from "@/components/RecurringTransactions";
import { usePushNotifications } from "./usePushNotifications";

const STORAGE_KEY = "upcomingBillAlerts";
const DEFAULT_LEAD_DAYS = 3;

export function daysUntil(date: Date, now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((target - start) / 86_400_000);
}

export function getUpcomingBills(
  recurring: RecurringTransaction[],
  leadDays: number = DEFAULT_LEAD_DAYS,
  now: Date = new Date()
): { bill: RecurringTransaction; days: number }[] {
  return recurring
    .filter((r) => r.isActive && r.type === "expense")
    .map((r) => ({ bill: r, days: daysUntil(new Date(r.nextDate), now) }))
    .filter(({ days }) => days >= 0 && days <= leadDays)
    .sort((a, b) => a.days - b.days);
}

/**
 * Notifică o singură dată pe zi pentru fiecare factură recurentă
 * care urmează să fie plătită în următoarele zile.
 */
export function useUpcomingBillAlerts(
  recurringTransactions: RecurringTransaction[],
  leadDays: number = DEFAULT_LEAD_DAYS
) {
  const { sendNotification } = usePushNotifications();
  const notified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!recurringTransactions.length) return;

    const today = new Date().toISOString().slice(0, 10);
    let stored: Record<string, string> = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      stored = {};
    }

    const upcoming = getUpcomingBills(recurringTransactions, leadDays);
    let changed = false;

    upcoming.forEach(({ bill, days }) => {
      const key = `${bill.id}-${today}`;
      if (stored[bill.id] === today || notified.current.has(key)) return;

      notified.current.add(key);
      stored[bill.id] = today;
      changed = true;

      const when =
        days === 0 ? "astăzi" : days === 1 ? "mâine" : `în ${days} zile`;

      toast.info(
        <div className="flex items-start gap-3">
          <CalendarClock className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Plată apropiată</div>
            <div className="text-sm mt-1">
              {bill.description || bill.category} — {bill.amount.toFixed(2)} RON, scadentă {when}.
            </div>
          </div>
        </div>,
        { duration: 6000, position: "top-center" }
      );

      sendNotification("📅 Plată apropiată", {
        body: `${bill.description || bill.category} — ${bill.amount.toFixed(2)} RON, scadentă ${when}.`,
        tag: `bill-${bill.id}`,
      });
    });

    if (changed) {
      // păstrăm doar intrările din ziua curentă
      const cleaned = Object.fromEntries(
        Object.entries(stored).filter(([, v]) => v === today)
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
  }, [recurringTransactions, leadDays, sendNotification]);
}
