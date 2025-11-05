import { useEffect, useState } from "react";
import { toast } from "sonner";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }

    // Register service worker for push notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser-ul tău nu suportă notificări");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Notificări activate cu succes!");
        return true;
      } else if (result === "denied") {
        toast.error("Notificările au fost blocate");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Eroare la solicitarea permisiunii:", error);
      toast.error("Eroare la activarea notificărilor");
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== "granted") {
      console.log("Permisiunea pentru notificări nu este acordată");
      return;
    }

    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    };

    if (registration && "showNotification" in registration) {
      // Use service worker notification (persistent)
      registration.showNotification(title, notificationOptions);
    } else if ("Notification" in window) {
      // Fallback to regular notification
      new Notification(title, notificationOptions);
    }
  };

  const sendBudgetAlert = (category: string, spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    let body = "";
    let urgency: "low" | "normal" | "high" = "normal";

    if (percentage >= 100) {
      body = `Ai depășit bugetul pentru ${category}! Ai cheltuit ${spent} RON din ${limit} RON.`;
      urgency = "high";
    } else if (percentage >= 90) {
      body = `Atenție! Ai atins ${percentage.toFixed(0)}% din bugetul pentru ${category}.`;
      urgency = "high";
    } else if (percentage >= 75) {
      body = `Ai folosit ${percentage.toFixed(0)}% din bugetul pentru ${category}.`;
      urgency = "normal";
    }

    if (body) {
      sendNotification("⚠️ Alertă Buget", {
        body,
        tag: `budget-${category}`,
        requireInteraction: urgency === "high",
      });
    }
  };

  const sendRecurringTransactionAlert = (description: string, amount: number) => {
    sendNotification("💰 Tranzacție Recurentă Procesată", {
      body: `${description} - ${amount} RON a fost procesată automat.`,
      tag: "recurring-transaction",
    });
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    sendBudgetAlert,
    sendRecurringTransactionAlert,
  };
};
