import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";

type ColorScheme = "light" | "dark";
type ThemeContextValue = { colorScheme: ColorScheme; setColorScheme: (scheme: ColorScheme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "pocket-budget-theme-v1";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const { setColorScheme: setNativeWindColorScheme } = useColorScheme();

  const applyScheme = useCallback((scheme: ColorScheme) => {
    try {
      setNativeWindColorScheme(scheme);
      Appearance.setColorScheme?.(scheme);
    } catch {}
  }, [setNativeWindColorScheme]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    AsyncStorage.setItem(THEME_KEY, scheme).catch(() => undefined);
    applyScheme(scheme);
  }, [applyScheme]);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") {
          setColorSchemeState(stored);
          applyScheme(stored);
        }
      })
      .catch(() => undefined);
  }, [applyScheme]);

  const value = useMemo(() => ({ colorScheme, setColorScheme }), [colorScheme, setColorScheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
