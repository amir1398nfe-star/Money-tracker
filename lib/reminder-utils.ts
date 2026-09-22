export type ReminderSettings = { billEnabled: boolean; billDay: number; budgetEnabled: boolean; budgetDay: number };
export const defaultReminderSettings: ReminderSettings = { billEnabled: false, billDay: 1, budgetEnabled: false, budgetDay: 25 };
export function normalizeReminderSettings(settings: Partial<ReminderSettings>): ReminderSettings {
  const day = (value: unknown, fallback: number) => Math.min(28, Math.max(1, Math.round(Number(value) || fallback)));
  return { billEnabled: Boolean(settings.billEnabled), billDay: day(settings.billDay, 1), budgetEnabled: Boolean(settings.budgetEnabled), budgetDay: day(settings.budgetDay, 25) };
}
