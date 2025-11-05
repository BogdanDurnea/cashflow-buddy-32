import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useState } from "react";

export const NotificationSettings = () => {
  const { permission, requestPermission } = usePushNotifications();
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [recurringAlerts, setRecurringAlerts] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(false);

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const isEnabled = permission === "granted";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Setări Notificări
        </CardTitle>
        <CardDescription>
          Gestionează notificările pentru alerte și rapoarte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEnabled ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Activează notificările pentru a primi alerte când te apropii de limita bugetului sau când sunt procesate tranzacții recurente.
            </p>
            <Button onClick={handleEnableNotifications} className="w-full">
              <Bell className="mr-2 h-4 w-4" />
              Activează Notificări
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="budget-alerts">Alerte Buget</Label>
                <p className="text-sm text-muted-foreground">
                  Primește notificări când te apropii de limita bugetului
                </p>
              </div>
              <Switch
                id="budget-alerts"
                checked={budgetAlerts}
                onCheckedChange={setBudgetAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recurring-alerts">Tranzacții Recurente</Label>
                <p className="text-sm text-muted-foreground">
                  Notificări când sunt procesate tranzacții automate
                </p>
              </div>
              <Switch
                id="recurring-alerts"
                checked={recurringAlerts}
                onCheckedChange={setRecurringAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="monthly-reports">Rapoarte Lunare</Label>
                <p className="text-sm text-muted-foreground">
                  Primește rezumat lunar al cheltuielilor tale
                </p>
              </div>
              <Switch
                id="monthly-reports"
                checked={monthlyReports}
                onCheckedChange={setMonthlyReports}
              />
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Notificările sunt activate! Vei primi alerte în timp real despre bugetul tău.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
