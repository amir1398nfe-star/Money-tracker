import { describe, expect, it } from "vitest";
import { chartSnapshotToHtml } from "../lib/chart-export-utils";

describe("chart report export", () => {
  it("builds a localized HTML report with saved categories", () => {
    const html = chartSnapshotToHtml({ id: "1", savedAt: "2026-09-22T07:00:00.000Z", categories: { groceries: 1200 } }, "en");
    expect(html).toContain("Spending chart report");
    expect(html).toContain("groceries");
    expect(html).toContain("1,200");
  });
});
