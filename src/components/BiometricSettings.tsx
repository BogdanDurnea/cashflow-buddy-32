import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Fingerprint, ShieldCheck, ShieldAlert } from "lucide-react";
import { useBiometricLock, isBiometricSupportedPlatform } from "@/hooks/useBiometricLock";
import { useToast } from "@/hooks/use-toast";

export function BiometricSettings() {
  const { enabled, setEnabled, available, biometryType } = useBiometricLock();
  const { toast } = useToast();

  const onNative = isBiometricSupportedPlatform();

  const typeLabel = (() => {
    switch (biometryType) {
      case 1: return "Touch ID";
      case 2: return "Face ID";
      case 3: return "Amprentă";
      case 4: return "Recunoaștere facială";
      case 5: return "Recunoaștere iris";
      default: return "Biometrie";
    }
  })();

  const handleToggle = async (next: boolean) => {
    const ok = await setEnabled(next);
    if (!ok) {
      toast({
        title: "Activare eșuată",
        description: "Verificarea biometrică nu a reușit.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: next ? "Blocare activată" : "Blocare dezactivată",
      description: next
        ? "Aplicația va cere autentificare biometrică la deschidere."
        : "Aplicația nu va mai cere autentificare biometrică.",
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          <CardTitle>Blocare biometrică</CardTitle>
        </div>
        <CardDescription>
          Protejează accesul la aplicație cu amprentă sau Face ID.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!onNative ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              Disponibil doar în aplicația mobilă instalată (Android/iOS). În browser această
              funcție nu poate fi activată.
            </div>
          </div>
        ) : !available ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              Dispozitivul tău nu are biometrie configurată. Adaugă o amprentă sau Face ID din
              setările sistemului.
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-success-light border border-success/20">
            <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Detectat: {typeLabel}</div>
              <div className="text-muted-foreground">Gata de utilizare.</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="space-y-0.5">
            <Label htmlFor="biometric-toggle" className="text-sm font-medium">
              Cere autentificare la deschidere
            </Label>
            <p className="text-xs text-muted-foreground">
              Aplicația se va bloca automat după 30 de secunde de inactivitate.
            </p>
          </div>
          <Switch
            id="biometric-toggle"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={!onNative || !available}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default BiometricSettings;