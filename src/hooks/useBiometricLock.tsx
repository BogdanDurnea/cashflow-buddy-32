import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric, BiometryType } from "capacitor-native-biometric";

const ENABLED_KEY = "biometric_lock_enabled";

export const isBiometricSupportedPlatform = () => Capacitor.isNativePlatform();

export async function checkBiometricAvailable(): Promise<{ available: boolean; type?: BiometryType; reason?: string }> {
  if (!isBiometricSupportedPlatform()) {
    return { available: false, reason: "web" };
  }
  try {
    const result = await NativeBiometric.isAvailable();
    return { available: result.isAvailable, type: result.biometryType };
  } catch (e: any) {
    return { available: false, reason: e?.message || "unknown" };
  }
}

export async function verifyBiometric(reason: string): Promise<boolean> {
  if (!isBiometricSupportedPlatform()) return true;
  try {
    await NativeBiometric.verifyIdentity({
      reason,
      title: "Autentificare biometrică",
      subtitle: "Confirmă identitatea pentru a accesa aplicația",
      description: reason,
    });
    return true;
  } catch {
    return false;
  }
}

export function useBiometricLock() {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ENABLED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [available, setAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType | undefined>();

  useEffect(() => {
    checkBiometricAvailable().then((r) => {
      setAvailable(r.available);
      setBiometryType(r.type);
    });
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    if (next) {
      const ok = await verifyBiometric("Activează blocarea biometrică");
      if (!ok) return false;
    }
    try {
      localStorage.setItem(ENABLED_KEY, next ? "true" : "false");
    } catch {}
    setEnabledState(next);
    return true;
  }, []);

  return { enabled, setEnabled, available, biometryType };
}

export function getBiometricEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}