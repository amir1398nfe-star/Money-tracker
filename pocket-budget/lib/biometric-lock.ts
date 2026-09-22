import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { t, type Locale } from "@/lib/i18n";

export function useBiometricAppLock(enabled: boolean, locale: Locale) {
  const [locked, setLocked] = useState(false);
  const backgroundAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    if (Platform.OS === "web" || !enabled) { setLocked(false); return true; }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) { setLocked(false); return true; }
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: t(locale, "biometricPrompt"), fallbackLabel: t(locale, "cancel") });
    if (result.success) setLocked(false);
    return result.success;
  }, [enabled, locale]);

  useEffect(() => {
    if (!enabled || Platform.OS === "web") { setLocked(false); return; }
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "background" || state === "inactive") backgroundAt.current = Date.now();
      if (state === "active" && backgroundAt.current && Date.now() - backgroundAt.current > 30000) {
        setLocked(true);
        await unlock();
        backgroundAt.current = null;
      }
    });
    return () => subscription.remove();
  }, [enabled, unlock]);

  return { locked, unlock };
}
