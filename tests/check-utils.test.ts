import { describe, expect, it } from "vitest";
import { isValidCheckDate, normalizeReminderDays } from "../lib/check-utils";

describe("check validation", () => {
  it("accepts real ISO dates and rejects impossible dates", () => {
    expect(isValidCheckDate("2026-10-12")).toBe(true);
    expect(isValidCheckDate("2026-02-31")).toBe(false);
  });
  it("keeps reminder days between 0 and 28", () => {
    expect(normalizeReminderDays("33")).toBe(28);
    expect(normalizeReminderDays("3")).toBe(3);
  });
});
