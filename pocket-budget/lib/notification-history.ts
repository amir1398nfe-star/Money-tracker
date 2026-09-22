import AsyncStorage from "@react-native-async-storage/async-storage";
export type NotificationHistoryItem = { id: string; title: string; body: string; receivedAt: string; kind?: string };
const KEY = "pocket-budget-notification-history-v1";
export async function getNotificationHistory(): Promise<NotificationHistoryItem[]> { try { const raw = await AsyncStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
export async function recordNotification(item: Omit<NotificationHistoryItem, "id" | "receivedAt">) { const current = await getNotificationHistory(); const next: NotificationHistoryItem = { ...item, id: `${Date.now()}-${Math.random()}`, receivedAt: new Date().toISOString() }; await AsyncStorage.setItem(KEY, JSON.stringify([next, ...current].slice(0, 30))); }
export async function clearNotificationHistory() { await AsyncStorage.removeItem(KEY); }
