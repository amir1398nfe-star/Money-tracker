import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { t, type Locale } from "@/lib/i18n";
import { defaultReminderSettings, normalizeReminderSettings, type ReminderSettings } from "@/lib/reminder-utils";
import type { CheckItem } from "@/lib/check-store";
export { defaultReminderSettings, type ReminderSettings } from "@/lib/reminder-utils";

const SETTINGS_KEY = "pocket-budget-reminders-v1";
const BILL_ID_KEY = "pocket-budget-reminder-bill-id";
const BUDGET_ID_KEY = "pocket-budget-reminder-budget-id";

if (Platform.OS !== "web") Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

export async function getReminderSettings(): Promise<ReminderSettings> {
  try { const raw = await AsyncStorage.getItem(SETTINGS_KEY); return raw ? normalizeReminderSettings(JSON.parse(raw) as Partial<ReminderSettings>) : defaultReminderSettings; } catch { return defaultReminderSettings; }
}

export async function saveReminderSettings(settings: ReminderSettings, locale: Locale) {
  const normalized = normalizeReminderSettings(settings);
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  await syncReminderNotifications(normalized, locale);
  return normalized;
}

async function cancelStored(key: string) {
  const id = await AsyncStorage.getItem(key);
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  await AsyncStorage.removeItem(key);
}

async function scheduleOne(key: string, enabled: boolean, day: number, title: string, body: string) {
  if (!enabled) { await cancelStored(key); return; }
  const id = await Notifications.scheduleNotificationAsync({ content: { title, body, data: { reminder: key } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: Math.min(28, Math.max(1, day)), hour: 9, minute: 0 } });
  await AsyncStorage.setItem(key, id);
}

export async function syncReminderNotifications(settings: ReminderSettings, locale: Locale) {
  if (Platform.OS === "web") return;
  const permission = await Notifications.getPermissionsAsync();
  if (settings.billEnabled || settings.budgetEnabled) {
    const status = permission.status === "granted" ? permission.status : (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return;
    if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("reminders", { name: t(locale, "reminders"), importance: Notifications.AndroidImportance.DEFAULT });
  }
  await scheduleOne(BILL_ID_KEY, settings.billEnabled, settings.billDay, t(locale, "billReminder"), t(locale, "billReminderBody"));
  await scheduleOne(BUDGET_ID_KEY, settings.budgetEnabled, settings.budgetDay, t(locale, "budgetReminder"), t(locale, "budgetReminderBody"));
}

export async function scheduleCheckReminder(check: CheckItem, locale: Locale) {
  if (Platform.OS === "web" || !check.reminderEnabled) return null;
  const permission = await Notifications.getPermissionsAsync();
  const status = permission.status === "granted" ? permission.status : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;
  const due = new Date(check.dueDate);
  due.setDate(due.getDate() - Math.min(28, Math.max(0, check.reminderDaysBefore)));
  due.setHours(9, 0, 0, 0);
  if (due.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({ content: { title: `${t(locale, "checkReminder")}: ${check.title}`, body: `${t(locale, "amount")}: ${check.amount} · ${check.notes || t(locale, "noNotes")}`, data: { reminder: "check", checkId: check.id } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: due } });
}

export async function cancelCheckReminder(notificationId?: string) {
  if (Platform.OS !== "web" && notificationId) await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
}
