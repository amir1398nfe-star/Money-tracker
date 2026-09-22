import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import type { ChartSnapshot } from "@/lib/chart-storage";
import { t, type Locale } from "@/lib/i18n";
import { chartSnapshotToHtml } from "@/lib/chart-export-utils";

export { chartSnapshotToHtml } from "@/lib/chart-export-utils";

export async function shareChartPdf(snapshot: ChartSnapshot, locale: Locale) {
  if (Platform.OS === "web") {
    const printWindow = typeof window !== "undefined" ? window.open("", "_blank", "width=760,height=900") : null;
    if (!printWindow) throw new Error("Popup blocked");
    printWindow.document.write(chartSnapshotToHtml(snapshot, locale));
    printWindow.document.close(); printWindow.focus(); printWindow.print(); return;
  }
  const { uri } = await Print.printToFileAsync({ html: chartSnapshotToHtml(snapshot, locale) });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing unavailable");
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: t(locale, "sharePdf") });
}

export async function shareChartPng(viewRef: unknown, locale: Locale) {
  const uri = await captureRef(viewRef as never, { format: "png", quality: 1 });
  if (Platform.OS === "web") {
    const anchor = document.createElement("a");
    anchor.href = uri;
    anchor.download = "pocket-budget-chart.png";
    anchor.click();
    return;
  }
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing unavailable");
  await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: t(locale, "sharePng") });
}
