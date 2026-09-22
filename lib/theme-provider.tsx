import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import { SchemeColors, type ColorScheme } from "@/constants/theme";

type ThemeContextValue = { colorScheme: ColorScheme; setColorScheme: (scheme: ColorScheme) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "pocket-budget-theme-v1";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const applyScheme = useCallback((scheme: ColorScheme) => { nativewindColorScheme.set(scheme); Appearance.setColorScheme?.(scheme); if (typeof document !== "undefined") { const root = document.documentElement; root.dataset.theme = scheme; root.classList.toggle("dark", scheme === "dark"); Object.entries(SchemeColors[scheme]).forEach(([token, value]) => root.style.setProperty(`--color-${token}`, value)); } }, []);
  const setColorScheme = useCallback((scheme: ColorScheme) => { setColorSchemeState(scheme); AsyncStorage.setItem(THEME_KEY, scheme).catch(() => undefined); applyScheme(scheme); }, [applyScheme]);
  useEffect(() => { AsyncStorage.getItem(THEME_KEY).then((stored) => { if (stored === "light" || stored === "dark") setColorSchemeState(stored); }).catch(() => undefined); }, []);
  useEffect(() => { applyScheme(colorScheme); }, [applyScheme, colorScheme]);
  const themeVariables = useMemo(() => vars({ "color-primary": SchemeColors[colorScheme].primary, "color-background": SchemeColors[colorScheme].background, "color-surface": SchemeColors[colorScheme].surface, "color-foreground": SchemeColors[colorScheme].foreground, "color-muted": SchemeColors[colorScheme].muted, "color-border": SchemeColors[colorScheme].border, "color-success": SchemeColors[colorScheme].success, "color-warning": SchemeColors[colorScheme].warning, "color-error": SchemeColors[colorScheme].error }), [colorScheme]);
  const value = useMemo(() => ({ colorScheme, setColorScheme }), [colorScheme, setColorScheme]);
  return <ThemeContext.Provider value={value}><View style={[{ flex: 1 }, themeVariables]}>{children}</View></ThemeContext.Provider>;
}
export function useThemeContext(): ThemeContextValue { const ctx = useContext(ThemeContext); if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider"); return ctx; }
