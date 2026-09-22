import { describe, expect, it } from "vitest";
import { getBudgetPercentage, getBudgetStatus, isInCurrentMonth } from "../lib/budget-utils";

describe("monthly budget calculations", () => {
  it("calculates and caps visual progress correctly", () => {
    expect(getBudgetPercentage(400, 1000)).toBe(40);
    expect(getBudgetPercentage(1200, 1000)).toBe(120);
    expect(getBudgetPercentage(400, 0)).toBe(0);
  });

  it("flags healthy, warning, and over-limit budgets", () => {
    expect(getBudgetStatus(400, 1000)).toBe("healthy");
    expect(getBudgetStatus(850, 1000)).toBe("warning");
    expect(getBudgetStatus(1000, 1000)).toBe("over");
  });

  it("recognizes transactions from the active calendar month", () => {
    const reference = new Date("2026-09-22T12:00:00.000Z");
    expect(isInCurrentMonth("2026-09-01T12:00:00.000Z", reference)).toBe(true);
    expect(isInCurrentMonth("2026-08-31T12:00:00.000Z", reference)).toBe(false);
  });
});
