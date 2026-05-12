import { useEffect, useState, useCallback, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Fingerprint, Lock } from "lucide-react";
import { getBiometricEnabled, verifyBiometric, isBiometricSupportedPlatform } from "@/hooks/useBiometricLock";

interface Props {
  children: React.ReactNode;
}

export const BiometricGate = ({ children }: Props) => {
  const [locked, setLocked] = useState<boolean>(() => isBiometricSupportedPlatform() && getBiometricEnabled());
  const [verifying, setVerifying] = useState(false);
  const lastBackground = useRef<number>(0);

  const tryUnlock = useCallback(async () => {
    if (verifying) return;
    setVerifying(true);
    const ok = await verifyBiometric("Deblochează MoneyTracker");
    setVerifying(false);
    if (ok) setLocked(false);
  }, [verifying]);

  // Initial unlock prompt
  useEffect(() => {
    if (locked) {
      tryUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-lock when app goes to background for >30s
  useEffect(() => {
    if (!isBiometricSupportedPlatform()) return;
    let sub: any;
    (async () => {
      sub = await CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (!getBiometricEnabled()) return;
        if (!isActive) {
          lastBackground.current = Date.now();
        } else {
          const away = Date.now() - lastBackground.current;
          if (lastBackground.current && away > 30_000) {
            setLocked(true);
          }
        }
      });
    })();
    return () => {
      sub?.remove?.();
    };
  }, []);

  // Auto-prompt when becoming locked
  useEffect(() => {
    if (locked && !verifying) {
      tryUnlock();
    }
  }, [locked, verifying, tryUnlock]);

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 gap-6">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-10 h-10 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Aplicație blocată</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Folosește amprenta sau Face ID pentru a continua.
        </p>
      </div>
      <Button size="lg" onClick={tryUnlock} disabled={verifying} className="gap-2">
        <Fingerprint className="w-5 h-5" />
        {verifying ? "Se verifică..." : "Deblochează"}
      </Button>
    </div>
  );
};

export default BiometricGate;