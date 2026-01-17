import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Bell, Globe, Palette, Save, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserSettingsProps {
  onRestartTutorial?: () => void;
}

export function UserSettings({ onRestartTutorial }: UserSettingsProps) {
  const { toast } = useToast();
  const [defaultCurrency, setDefaultCurrency] = useState("RON");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState("5000");

  const handleSave = () => {
    toast({
      title: "Setări salvate",
      description: "Preferințele tale au fost actualizate cu succes.",
    });
  };

  const handleRestartTutorial = () => {
    if (onRestartTutorial) {
      onRestartTutorial();
      toast({
        title: "Tutorial repornit",
        description: "Tutorialul de onboarding va fi afișat din nou.",
      });
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Setări Utilizator</CardTitle>
        </div>
        <CardDescription>
          Personalizează experiența ta și gestionează preferințele
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <Label htmlFor="currency" className="text-sm font-medium">Monedă Implicită</Label>
          </div>
          <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RON">RON - Leu Românesc</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="USD">USD - Dolar American</SelectItem>
              <SelectItem value="GBP">GBP - Liră Sterlină</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Budget Settings */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <Label htmlFor="budget" className="text-sm font-medium">Buget Lunar Țintă</Label>
          </div>
          <Input
            id="budget"
            type="number"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            placeholder="5000"
          />
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Notificări</Label>
          </div>

          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notif" className="text-sm">Notificări Email</Label>
                <p className="text-xs text-muted-foreground">Primește actualizări prin email</p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="budget-alerts" className="text-sm">Alerte Buget</Label>
                <p className="text-xs text-muted-foreground">Notificări când depășești bugetul</p>
              </div>
              <Switch
                id="budget-alerts"
                checked={budgetAlerts}
                onCheckedChange={setBudgetAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reports" className="text-sm">Rapoarte Săptămânale</Label>
                <p className="text-xs text-muted-foreground">Primește un rezumat săptămânal</p>
              </div>
              <Switch
                id="weekly-reports"
                checked={weeklyReports}
                onCheckedChange={setWeeklyReports}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvează Setările
          </Button>
          
          {onRestartTutorial && (
            <Button 
              variant="outline" 
              onClick={handleRestartTutorial} 
              className="w-full"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Repornește Tutorialul
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
