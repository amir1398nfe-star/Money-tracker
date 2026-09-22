import { describe, expect, it } from "vitest";

describe("Bazaar billing configuration", () => {
  it("has a configured RSA key and the expected one-time product SKU", () => {
    expect(process.env.EXPO_PUBLIC_BAZAAR_RSA_KEY?.trim()).toBeTruthy();
    expect(process.env.EXPO_PUBLIC_BAZAAR_PIE_SKU || "premium_pie_chart").toBe("premium_pie_chart");
  });
});
