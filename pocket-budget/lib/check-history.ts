import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CheckStatus } from "@/lib/check-store";
export type CheckHistoryKind = "created" | "updated" | "status" | "deleted";
export type CheckHistoryItem = { id: string; checkId: string; title: string; kind: CheckHistoryKind; at: string; fromStatus?: CheckStatus; toStatus?: CheckStatus; amount?: number };
const KEY = "pocket-budget-check-history-v1";
export async function getCheckHistory() { const raw = await AsyncStorage.getItem(KEY); return raw ? (JSON.parse(raw) as CheckHistoryItem[]) : []; }
export async function recordCheckHistory(item: Omit<CheckHistoryItem, "id" | "at">) { const current = await getCheckHistory(); const next: CheckHistoryItem = { ...item, id: `${Date.now()}-${Math.random()}`, at: new Date().toISOString() }; await AsyncStorage.setItem(KEY, JSON.stringify([next, ...current].slice(0, 100))); }
export async function clearCheckHistory() { await AsyncStorage.removeItem(KEY); }
