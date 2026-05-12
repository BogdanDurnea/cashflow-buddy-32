import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const isNativePlatform = vi.fn(() => true);
const isAvailable = vi.fn(async () => ({ isAvailable: true, biometryType: 3 }));
const verifyIdentity = vi.fn(async (_opts?: any) => undefined);

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => isNativePlatform(),
  },
}));

vi.mock("capacitor-native-biometric", () => ({
  NativeBiometric: {
    isAvailable: () => isAvailable(),
    verifyIdentity: (opts: any) => verifyIdentity(opts),
  },
  BiometryType: {
    TOUCH_ID: 1,
    FACE_ID: 2,
    FINGERPRINT: 3,
  },
}));

import {
  isBiometricSupportedPlatform,
  checkBiometricAvailable,
  verifyBiometric,
  getBiometricEnabled,
  useBiometricLock,
} from "./useBiometricLock";

describe("useBiometricLock module", () => {
  beforeEach(() => {
    localStorage.clear();
    isNativePlatform.mockReturnValue(true);
    isAvailable.mockResolvedValue({ isAvailable: true, biometryType: 3 });
    verifyIdentity.mockResolvedValue(undefined);
  });

  it("isBiometricSupportedPlatform reflects Capacitor.isNativePlatform", () => {
    expect(isBiometricSupportedPlatform()).toBe(true);
    isNativePlatform.mockReturnValue(false);
    expect(isBiometricSupportedPlatform()).toBe(false);
  });

  it("checkBiometricAvailable returns reason 'web' on non-native", async () => {
    isNativePlatform.mockReturnValue(false);
    const r = await checkBiometricAvailable();
    expect(r).toEqual({ available: false, reason: "web" });
  });

  it("checkBiometricAvailable returns availability + type on native", async () => {
    const r = await checkBiometricAvailable();
    expect(r.available).toBe(true);
    expect(r.type).toBe(3);
  });

  it("checkBiometricAvailable handles plugin errors", async () => {
    isAvailable.mockRejectedValueOnce(new Error("boom"));
    const r = await checkBiometricAvailable();
    expect(r).toEqual({ available: false, reason: "boom" });
  });

  it("verifyBiometric returns true when identity verified", async () => {
    await expect(verifyBiometric("test")).resolves.toBe(true);
    expect(verifyIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "test" })
    );
  });

  it("verifyBiometric returns false when verification throws", async () => {
    verifyIdentity.mockRejectedValueOnce(new Error("denied"));
    await expect(verifyBiometric("x")).resolves.toBe(false);
  });

  it("verifyBiometric short-circuits to true on web", async () => {
    isNativePlatform.mockReturnValue(false);
    await expect(verifyBiometric("x")).resolves.toBe(true);
    expect(verifyIdentity).not.toHaveBeenCalled();
  });

  it("getBiometricEnabled reads localStorage", () => {
    expect(getBiometricEnabled()).toBe(false);
    localStorage.setItem("biometric_lock_enabled", "true");
    expect(getBiometricEnabled()).toBe(true);
  });
});

describe("useBiometricLock hook", () => {
  beforeEach(() => {
    localStorage.clear();
    isNativePlatform.mockReturnValue(true);
    isAvailable.mockResolvedValue({ isAvailable: true, biometryType: 3 });
    verifyIdentity.mockResolvedValue(undefined);
  });

  it("loads availability + biometryType from plugin", async () => {
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});
    expect(result.current.available).toBe(true);
    expect(result.current.biometryType).toBe(3);
    expect(result.current.enabled).toBe(false);
  });

  it("setEnabled(true) requires verification and persists to localStorage", async () => {
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});
    let ok = false;
    await act(async () => {
      ok = await result.current.setEnabled(true);
    });
    expect(ok).toBe(true);
    expect(result.current.enabled).toBe(true);
    expect(localStorage.getItem("biometric_lock_enabled")).toBe("true");
  });

  it("setEnabled(true) returns false when verification fails and does not persist", async () => {
    verifyIdentity.mockRejectedValueOnce(new Error("nope"));
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});
    let ok = true;
    await act(async () => {
      ok = await result.current.setEnabled(true);
    });
    expect(ok).toBe(false);
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem("biometric_lock_enabled")).not.toBe("true");
  });

  it("setEnabled(false) disables without verification prompt", async () => {
    localStorage.setItem("biometric_lock_enabled", "true");
    const { result } = renderHook(() => useBiometricLock());
    await act(async () => {});
    expect(result.current.enabled).toBe(true);
    verifyIdentity.mockClear();
    await act(async () => {
      await result.current.setEnabled(false);
    });
    expect(verifyIdentity).not.toHaveBeenCalled();
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem("biometric_lock_enabled")).toBe("false");
  });
});