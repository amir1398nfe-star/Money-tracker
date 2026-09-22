import type { CheckItem } from "@/lib/check-store";
export function getDueChecks(checks: CheckItem[], today = new Date().toISOString().slice(0, 10)) { return checks.filter((check) => check.status === "pending" && check.dueDate <= today); }
export function getDueChecksTotal(checks: CheckItem[]) { return checks.reduce((sum, check) => sum + check.amount, 0); }
