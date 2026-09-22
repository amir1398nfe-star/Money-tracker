import { describe, expect, it } from "vitest";
import { formatMoney, localeMeta, t } from "../lib/i18n";

describe("finance localization", () => {
  it("returns the correct label for all supported locales", () => {
    expect(t("fa", "analytics")).toBe("تحلیل");
    expect(t("en", "analytics")).toBe("Analytics");
    expect(t("ar", "analytics")).toBe("التحليل");
    expect(t("tr", "analytics")).toBe("Analiz");
    expect(t("tr", "reminders")).toBe("Hatırlatıcılar");
    expect(t("tr", "biometricLock")).toBe("Parmak izi ve Face ID kilidi");
  });

  it("keeps RTL metadata for Persian and Arabic", () => {
    expect(localeMeta.fa.direction).toBe("rtl");
    expect(localeMeta.ar.direction).toBe("rtl");
    expect(localeMeta.en.direction).toBe("ltr");
    expect(localeMeta.tr.direction).toBe("ltr");
  });

  it("formats money with a localized currency suffix", () => {
    expect(formatMoney(250000, "fa")).toContain("تومان");
    expect(formatMoney(250000, "en")).toContain("Toman");
    expect(formatMoney(250000, "ar")).toContain("تومان");
    expect(formatMoney(250000, "tr")).toContain("TL");
  });

  it("provides the onboarding tour copy in every supported locale", () => {
    for (const locale of ["fa", "en", "ar", "tr"] as const) {
      expect(t(locale, "tourTransactionsTitle")).toBeTruthy();
      expect(t(locale, "tourBudgetBody")).toBeTruthy();
      expect(t(locale, "tourStart")).toBeTruthy();
    }
  });
});
