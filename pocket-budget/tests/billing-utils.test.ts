import { describe, expect, it } from "vitest";
import { hasPurchasedProduct } from "../lib/billing-utils";

describe("Bazaar paid access", () => {
  it("recognizes the paid pie-chart product", () => {
    expect(hasPurchasedProduct([{ productId: "premium_pie_chart" }], "premium_pie_chart")).toBe(true);
    expect(hasPurchasedProduct([{ productId: "other_product" }], "premium_pie_chart")).toBe(false);
  });
});
