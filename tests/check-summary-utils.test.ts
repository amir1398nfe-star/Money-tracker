import { describe, expect, it } from "vitest";
import { getDueChecks, getDueChecksTotal } from "../lib/check-summary-utils";
import type { CheckItem } from "../lib/check-store";
const check = (id: string, status: CheckItem["status"], dueDate: string, amount: number): CheckItem => ({ id, title: id, status, dueDate, amount, notes: "", reminderEnabled: false, reminderDaysBefore: 3 });
describe("check dashboard summary", () => { it("includes only pending checks due today or earlier", () => { const due = getDueChecks([check("a", "pending", "2026-09-21", 10), check("b", "paid", "2026-09-20", 20), check("c", "pending", "2026-09-23", 30)], "2026-09-22"); expect(due.map((item) => item.id)).toEqual(["a"]); expect(getDueChecksTotal(due)).toBe(10); }); });
