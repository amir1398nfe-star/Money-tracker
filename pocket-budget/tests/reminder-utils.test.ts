import { describe, expect, it } from "vitest";
import { normalizeReminderSettings } from "../lib/reminder-utils";

describe("reminder settings", () => {
  it("clamps monthly reminder days to the safe 1-28 range", () => {
    expect(normalizeReminderSettings({ billEnabled: true, billDay: 0, budgetEnabled: true, budgetDay: 44 })).toEqual({ billEnabled: true, billDay: 1, budgetEnabled: true, budgetDay: 28 });
  });
});
