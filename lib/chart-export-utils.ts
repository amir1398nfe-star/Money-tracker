import { localeMeta, t, type Locale } from "./i18n";
import type { ChartSnapshot } from "./chart-storage";

function formatDate(value: string, locale: Locale) {
  const language = locale === "fa" ? "fa-IR" : locale === "ar" ? "ar" : locale === "tr" ? "tr-TR" : "en-US";
  return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function chartSnapshotToHtml(snapshot: ChartSnapshot, locale: Locale) {
  const rtl = localeMeta[locale].direction === "rtl";
  const rows = Object.entries(snapshot.categories).map(([category, value]) => `<tr><td>${category}</td><td>${new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale === "tr" ? "tr-TR" : locale).format(value)}</td></tr>`).join("");
  return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body dir="${rtl ? "rtl" : "ltr"}" style="font-family:Arial,sans-serif;padding:28px;color:#28243E"><h1>${t(locale, "savedReport")}</h1><p>${t(locale, "savedOn")}: ${formatDate(snapshot.savedAt, locale)}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:${rtl ? "right" : "left"};padding:10px;background:#F0ECFF">${t(locale, "category")}</th><th style="text-align:${rtl ? "right" : "left"};padding:10px;background:#F0ECFF">${t(locale, "amount")}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}
