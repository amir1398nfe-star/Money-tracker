export function isValidCheckDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }
export function normalizeReminderDays(value: string) { return Math.min(28, Math.max(0, Number(value.replace(/[^0-9]/g, "")) || 0)); }
