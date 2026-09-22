import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CheckStatus = "pending" | "paid" | "bounced";
export type CheckItem = { id: string; title: string; amount: number; dueDate: string; notes: string; status: CheckStatus; reminderEnabled: boolean; reminderDaysBefore: number; notificationId?: string };
const STORAGE_KEY = "pocket-budget-checks-v1";
type CheckContextValue = { checks: CheckItem[]; addCheck: (check: Omit<CheckItem, "id">) => CheckItem; updateCheck: (id: string, patch: Partial<CheckItem>) => void; removeCheck: (id: string) => void; isReady: boolean };
const CheckContext = createContext<CheckContextValue | null>(null);

export function CheckProvider({ children }: { children: React.ReactNode }) {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) setChecks((JSON.parse(raw) as Partial<CheckItem>[]).map((item) => ({ ...item, status: item.status ?? "pending" } as CheckItem))); }).catch(() => undefined).finally(() => setIsReady(true)); }, []);
  useEffect(() => { if (isReady) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checks)).catch(() => undefined); }, [checks, isReady]);
  const value = useMemo<CheckContextValue>(() => ({ checks, isReady, addCheck: (check) => { const item = { ...check, id: `${Date.now()}` }; setChecks((current) => [item, ...current]); return item; }, updateCheck: (id, patch) => setChecks((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item)), removeCheck: (id) => setChecks((current) => current.filter((item) => item.id !== id)) }), [checks, isReady]);
  return <CheckContext.Provider value={value}>{children}</CheckContext.Provider>;
}
export function useChecks() { const context = useContext(CheckContext); if (!context) throw new Error("useChecks must be used within CheckProvider"); return context; }
