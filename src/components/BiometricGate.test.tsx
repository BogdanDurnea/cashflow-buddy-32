import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

const isSupported = vi.fn(() => true);
const getEnabled = vi.fn(() => true);
const verify = vi.fn(async (_r: string) => true);

vi.mock("@/hooks/useBiometricLock", () => ({
  isBiometricSupportedPlatform: () => isSupported(),
  getBiometricEnabled: () => getEnabled(),
  verifyBiometric: (r: string) => verify(r),
}));

let appStateHandler: ((s: { isActive: boolean }) => void) | null = null;
const removeListener = vi.fn();
const addListener = vi.fn(async (_evt: string, cb: any) => {
  appStateHandler = cb;
  return { remove: removeListener };
});

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (evt: string, cb: any) => addListener(evt, cb),
  },
}));

import { BiometricGate } from "./BiometricGate";

const Child = () => <div>UNLOCKED_CONTENT</div>;

describe("BiometricGate", () => {
  beforeEach(() => {
    vi.useRealTimers();
    isSupported.mockReturnValue(true);
    getEnabled.mockReturnValue(true);
    verify.mockReset().mockResolvedValue(true);
    addListener.mockClear();
    removeListener.mockClear();
    appStateHandler = null;
  });

  it("renders children directly when biometric is not supported (web)", async () => {
    isSupported.mockReturnValue(false);
    render(<BiometricGate><Child /></BiometricGate>);
    expect(screen.getByText("UNLOCKED_CONTENT")).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it("renders children directly when biometric lock is disabled", async () => {
    getEnabled.mockReturnValue(false);
    render(<BiometricGate><Child /></BiometricGate>);
    expect(screen.getByText("UNLOCKED_CONTENT")).toBeInTheDocument();
  });

  it("shows lock screen and unlocks after successful verify", async () => {
    render(<BiometricGate><Child /></BiometricGate>);
    expect(screen.getByText(/Aplicație blocată/i)).toBeInTheDocument();
    await waitFor(() => expect(verify).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText("UNLOCKED_CONTENT")).toBeInTheDocument()
    );
  });

  it("stays locked when verify fails", async () => {
    verify.mockResolvedValue(false);
    render(<BiometricGate><Child /></BiometricGate>);
    await waitFor(() => expect(verify).toHaveBeenCalled());
    expect(screen.queryByText("UNLOCKED_CONTENT")).not.toBeInTheDocument();
    expect(screen.getByText(/Aplicație blocată/i)).toBeInTheDocument();
  });

  it("registers appStateChange listener and re-locks after >30s in background", async () => {
    verify.mockResolvedValue(true);
    render(<BiometricGate><Child /></BiometricGate>);
    await waitFor(() =>
      expect(screen.getByText("UNLOCKED_CONTENT")).toBeInTheDocument()
    );
    await waitFor(() => expect(addListener).toHaveBeenCalledWith("appStateChange", expect.any(Function)));
    expect(appStateHandler).toBeTruthy();

    const realNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      // Make next verify hang so we can observe locked UI
      verify.mockImplementation(() => new Promise(() => {}));
      await act(async () => {
        appStateHandler!({ isActive: false });
      });
      now += 31_000;
      await act(async () => {
        appStateHandler!({ isActive: true });
      });
      await waitFor(() =>
        expect(screen.getByText(/Aplicație blocată/i)).toBeInTheDocument()
      );
    } finally {
      Date.now = realNow;
    }
  });

  it("does NOT re-lock if background time was <30s", async () => {
    render(<BiometricGate><Child /></BiometricGate>);
    await waitFor(() =>
      expect(screen.getByText("UNLOCKED_CONTENT")).toBeInTheDocument()
    );
    await waitFor(() => expect(appStateHandler).toBeTruthy());

    const realNow = Date.now;
    let now = 2_000_000;
    Date.now = () => now;
    try {
      await act(async () => {
        appStateHandler!({ isActive: false });
      });
      now += 5_000;
      await act(async () => {
        appStateHandler!({ isActive: true });
      });
      expect(screen.getByText("UNLOCKED_CONTENT")).toBeInTheDocument();
    } finally {
      Date.now = realNow;
    }
  });

  it("removes appStateChange listener on unmount", async () => {
    const { unmount } = render(<BiometricGate><Child /></BiometricGate>);
    await waitFor(() => expect(addListener).toHaveBeenCalled());
    unmount();
    await waitFor(() => expect(removeListener).toHaveBeenCalled());
  });
});