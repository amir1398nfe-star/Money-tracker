import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Budget = {
  id: string;
  category: string;
  limit: number;
  color: string;
};

const STORAGE_KEY = "pocket-budget-budgets-v1";
const starterBudgets: Budget[] = [
  { id: "groceries", category: "groceries", limit: 8000000, color: "#FF8A65" },
  { id: "bills", category: "bills", limit: 4500000, color: "#4ECDC4" },
  { id: "cafe", category: "cafe", limit: 2500000, color: "#F5B544" },
  { id: "transport", category: "transport", limit: 1800000, color: "#58A6FF" },
];

type BudgetContextValue = {
  budgets: Budget[];
  setBudgetLimit: (id: string, limit: number) => void;
  addBudget: (category: string, limit: number, color: string) => void;
  isReady: boolean;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>(starterBudgets);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setBudgets(JSON.parse(raw) as Budget[]);
      })
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (isReady) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(budgets)).catch(() => undefined);
  }, [budgets, isReady]);

  const value = useMemo<BudgetContextValue>(() => ({
    budgets,
    setBudgetLimit: (id, limit) => setBudgets((current) => current.map((budget) => budget.id === id ? { ...budget, limit } : budget)),
    addBudget: (category, limit, color) => setBudgets((current) => [...current, { id: `${category}-${Date.now()}`, category, limit, color }]),
    isReady,
  }), [budgets, isReady]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudgets() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error("useBudgets must be used within BudgetProvider");
  return context;
}
