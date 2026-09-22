import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "./i18n";
import { restorePieChartUnlock } from "./bazaar-billing";

type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  color: string;
};

type FinanceContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id" | "date">) => void;
  pieUnlocked: boolean;
  unlockPie: () => void;
  isReady: boolean;
  hasSelectedLocale: boolean;
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
};

const STORAGE_KEY = "pocket-budget-state-v1";
// Initial Bazaar submission: all premium screens are temporarily open.
// Set this to false when the paid Bazaar release is ready.
export const INITIAL_FREE_BUILD = true;

const starterTransactions: Transaction[] = [
  { id: "1", title: "حقوق شهریور", amount: 65000000, type: "income", category: "salary", date: "2026-09-21T09:00:00.000Z", color: "#7C5CFC" },
  { id: "2", title: "خرید هفتگی", amount: 4200000, type: "expense", category: "groceries", date: "2026-09-20T16:00:00.000Z", color: "#FF8A65" },
  { id: "3", title: "قبض اینترنت", amount: 1800000, type: "expense", category: "bills", date: "2026-09-18T10:30:00.000Z", color: "#4ECDC4" },
  { id: "4", title: "کافه آخر هفته", amount: 950000, type: "expense", category: "cafe", date: "2026-09-16T19:00:00.000Z", color: "#F5B544" },
  { id: "5", title: "تاکسی", amount: 380000, type: "expense", category: "transport", date: "2026-09-15T08:20:00.000Z", color: "#58A6FF" },
];

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fa");
  const [transactions, setTransactions] = useState<Transaction[]>(starterTransactions);
  const [pieUnlocked, setPieUnlocked] = useState(INITIAL_FREE_BUILD);
  const [isReady, setIsReady] = useState(false);
  const [hasSelectedLocale, setHasSelectedLocale] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<{ locale: Locale; transactions: Transaction[]; localeSelected: boolean; biometricEnabled: boolean }>;
          if (parsed.locale) setLocaleState(parsed.locale);
          if (parsed.transactions) setTransactions(parsed.transactions);
          setHasSelectedLocale(parsed.localeSelected ?? true);
          setBiometricEnabled(Boolean(parsed.biometricEnabled));
        }
        if (!INITIAL_FREE_BUILD) {
          const restored = await restorePieChartUnlock();
          if (mounted && restored.status === "success") setPieUnlocked(true);
        }
      })
      .catch(() => undefined)
      .finally(() => { if (mounted) setIsReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, transactions, pieUnlocked, localeSelected: hasSelectedLocale, biometricEnabled })).catch(() => undefined);
  }, [isReady, locale, transactions, pieUnlocked, hasSelectedLocale, biometricEnabled]);

  const value = useMemo<FinanceContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => { setLocaleState(nextLocale); setHasSelectedLocale(true); },
    transactions,
    addTransaction: (transaction) => {
      setTransactions((current) => [
        { ...transaction, id: `${Date.now()}`, date: new Date().toISOString() },
        ...current,
      ]);
    },
    pieUnlocked,
    unlockPie: () => setPieUnlocked(true),
    isReady,
    hasSelectedLocale,
    biometricEnabled,
    setBiometricEnabled,
  }), [locale, transactions, pieUnlocked, isReady, hasSelectedLocale, biometricEnabled]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within FinanceProvider");
  return context;
}

export type { TransactionType };
