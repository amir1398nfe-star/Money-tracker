import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ViewShot from "react-native-view-shot";
import { ScreenContainer } from "@/components/screen-container";
import { PieChart } from "@/components/finance-components";
import { useFinance } from "@/lib/finance-store";
import { formatMoney, localeMeta, t, type Locale } from "@/lib/i18n";
import { deleteChartSnapshot, getSavedChartSnapshots, renameChartSnapshot, type ChartSnapshot } from "@/lib/chart-storage";
import { shareChartPdf, shareChartPng } from "@/lib/chart-export";

const chartColors = ["#7C5CFC", "#FF8A65", "#4ECDC4", "#F5B544", "#58A6FF", "#B2A9C9"];

function formatDate(value: string, locale: Locale) {
  const language = locale === "fa" ? "fa-IR" : locale === "ar" ? "ar" : "en-US";
  return new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function monthKey(value: string) { return value.slice(0, 7); }
function formatMonth(value: string, locale: Locale) {
  const language = locale === "fa" ? "fa-IR" : locale === "ar" ? "ar" : "en-US";
  return new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(new Date(`${value}-01T00:00:00`));
}

export default function SavedReportsScreen() {
  const { locale, pieUnlocked } = useFinance();
  const [reports, setReports] = useState<ChartSnapshot[]>([]);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const shotRefs = useRef<Record<string, unknown>>({});
  const isRTL = localeMeta[locale].direction === "rtl";

  const loadReports = () => getSavedChartSnapshots().then(setReports).catch(() => setReports([]));
  useEffect(() => { if (pieUnlocked) loadReports(); }, [pieUnlocked]);

  const months = useMemo(() => [...new Set(reports.map((report) => monthKey(report.savedAt)))], [reports]);
  const categories = useMemo(() => [...new Set(reports.flatMap((report) => Object.keys(report.categories)))], [reports]);
  const filteredReports = useMemo(() => reports.filter((report) => (selectedMonth === "all" || monthKey(report.savedAt) === selectedMonth) && (selectedCategory === "all" || Object.prototype.hasOwnProperty.call(report.categories, selectedCategory))), [reports, selectedMonth, selectedCategory]);

  const share = async (report: ChartSnapshot, kind: "pdf" | "png") => {
    setSharingId(`${kind}-${report.id}`);
    try {
      if (kind === "pdf") await shareChartPdf(report, locale);
      else await shareChartPng(shotRefs.current[report.id], locale);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert(kind === "pdf" ? t(locale, "sharePdf") : t(locale, "sharePng"), t(locale, "shareUnavailable")); }
    finally { setSharingId(null); }
  };

  const openRename = (report: ChartSnapshot) => { setRenameId(report.id); setRenameValue(report.title ?? ""); };
  const saveRename = async () => {
    if (!renameId) return;
    await renameChartSnapshot(renameId, renameValue);
    setRenameId(null); await loadReports(); Alert.alert(t(locale, "renameReport"), t(locale, "reportRenamed"));
  };
  const removeReport = (report: ChartSnapshot) => Alert.alert(t(locale, "deleteConfirmTitle"), t(locale, "deleteConfirmMessage"), [{ text: t(locale, "cancel"), style: "cancel" }, { text: t(locale, "delete"), style: "destructive", onPress: async () => { await deleteChartSnapshot(report.id); await loadReports(); Alert.alert(t(locale, "deleteReport"), t(locale, "reportDeleted")); } }]);

  return (
    <ScreenContainer containerClassName="bg-[#F8F7FC]" safeAreaClassName="bg-[#F8F7FC]">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6, alignSelf: isRTL ? "flex-end" : "flex-start", paddingVertical: 8 }, pressed && { opacity: 0.65 }]}><MaterialIcons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color="#7C5CFC" /><Text style={{ color: "#7C5CFC", fontSize: 12, fontWeight: "800" }}>{t(locale, "back")}</Text></Pressable>
        <View style={{ marginTop: 12, alignItems: isRTL ? "flex-end" : "flex-start", gap: 5 }}><Text style={{ color: "#9996A8", fontSize: 12, fontWeight: "600" }}>{t(locale, "analytics")}</Text><Text style={{ color: "#28243E", fontSize: 28, fontWeight: "900" }}>{t(locale, "savedReports")}</Text></View>
        {!pieUnlocked ? <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 28, marginTop: 22, alignItems: "center", gap: 12 }}><MaterialIcons name="lock-outline" size={42} color="#7C5CFC" /><Text style={{ color: "#28243E", fontSize: 16, fontWeight: "900", textAlign: "center" }}>{t(locale, "pieChartLocked")}</Text><Text style={{ color: "#9996A8", fontSize: 12, textAlign: "center", lineHeight: 19 }}>{t(locale, "unlockDescription")}</Text></View> : <>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 18, padding: 14, marginTop: 20, gap: 11 }}>
            <Text style={{ color: "#777487", fontSize: 11, fontWeight: "800", textAlign: isRTL ? "right" : "left" }}>{t(locale, "monthFilter")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}><FilterChip label={t(locale, "allMonths")} active={selectedMonth === "all"} onPress={() => setSelectedMonth("all")} /><FilterChipList values={months} selected={selectedMonth} locale={locale} format={formatMonth} onPress={setSelectedMonth} /></ScrollView>
            <Text style={{ color: "#777487", fontSize: 11, fontWeight: "800", textAlign: isRTL ? "right" : "left", marginTop: 3 }}>{t(locale, "categoryFilter")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}><FilterChip label={t(locale, "allCategories")} active={selectedCategory === "all"} onPress={() => setSelectedCategory("all")} /><FilterChipList values={categories} selected={selectedCategory} locale={locale} format={(value) => t(locale, value as never)} onPress={setSelectedCategory} /></ScrollView>
          </View>
          {filteredReports.length === 0 ? <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 28, marginTop: 22, alignItems: "center", gap: 12 }}><MaterialIcons name="folder-open" size={42} color="#B8A8FF" /><Text style={{ color: "#777487", fontSize: 13, fontWeight: "800", textAlign: "center" }}>{t(locale, "noSavedReports")}</Text></View> : <View style={{ gap: 14, marginTop: 22 }}>{filteredReports.map((report) => { const total = Object.values(report.categories).reduce((sum, value) => sum + value, 0); const values = Object.entries(report.categories).map(([category, value], index) => ({ value, color: chartColors[index % chartColors.length], category })); return <View key={report.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#EFEDF6", gap: 14 }}><ViewShot ref={(ref) => { shotRefs.current[report.id] = ref; }} options={{ format: "png", quality: 1 }}><View style={{ backgroundColor: "#FFFFFF", padding: 6, alignItems: "center" }}><PieChart values={values} size={118} /></View></ViewShot><View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}><View style={{ flex: 1, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 9 }}><View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: "#F0ECFF", alignItems: "center", justifyContent: "center" }}><MaterialIcons name="pie-chart" size={20} color="#7C5CFC" /></View><View style={{ gap: 3, alignItems: isRTL ? "flex-end" : "flex-start", flex: 1 }}><Text style={{ color: "#28243E", fontSize: 14, fontWeight: "900" }} numberOfLines={1}>{report.title || t(locale, "savedReport")}</Text><Text style={{ color: "#9996A8", fontSize: 10 }}>{t(locale, "savedOn")} {formatDate(report.savedAt, locale)}</Text></View></View><Text style={{ color: "#7C5CFC", fontSize: 13, fontWeight: "900" }}>{formatMoney(total, locale)}</Text></View><View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}><ActionButton icon="edit" label={t(locale, "renameReport")} onPress={() => openRename(report)} /><ActionButton icon="delete-outline" label={t(locale, "deleteReport")} onPress={() => removeReport(report)} danger /></View><View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}><ActionButton icon="picture-as-pdf" label={t(locale, "sharePdf")} onPress={() => share(report, "pdf")} loading={sharingId === `pdf-${report.id}`} /><ActionButton icon="image" label={t(locale, "sharePng")} onPress={() => share(report, "png")} loading={sharingId === `png-${report.id}`} /></View></View>; })}</View>}
        </>}
      </ScrollView>
      <Modal visible={renameId !== null} transparent animationType="fade" onRequestClose={() => setRenameId(null)}><View style={{ flex: 1, backgroundColor: "rgba(30,20,55,0.5)", alignItems: "center", justifyContent: "center", padding: 24 }}><View style={{ width: "100%", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 22, gap: 14 }}><Text style={{ color: "#28243E", fontSize: 17, fontWeight: "900", textAlign: isRTL ? "right" : "left" }}>{t(locale, "renameReport")}</Text><TextInput value={renameValue} onChangeText={setRenameValue} autoFocus placeholder={t(locale, "savedReport")} style={{ borderWidth: 1, borderColor: "#E7E3F2", borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, color: "#28243E", textAlign: isRTL ? "right" : "left" }} /><View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 9 }}><Pressable onPress={() => setRenameId(null)} style={{ flex: 1, backgroundColor: "#F2F0F7", borderRadius: 13, paddingVertical: 13, alignItems: "center" }}><Text style={{ color: "#777487", fontWeight: "800" }}>{t(locale, "cancel")}</Text></Pressable><Pressable onPress={saveRename} style={{ flex: 1, backgroundColor: "#7C5CFC", borderRadius: 13, paddingVertical: 13, alignItems: "center" }}><Text style={{ color: "#FFFFFF", fontWeight: "800" }}>{t(locale, "save")}</Text></Pressable></View></View></View></Modal>
    </ScreenContainer>
  );
}

function FilterChipList({ values, selected, locale, format, onPress }: { values: string[]; selected: string; locale: Locale; format: (value: string, locale: Locale) => string; onPress: (value: string) => void }) { return <>{values.map((value) => <FilterChip key={value} label={format(value, locale)} active={selected === value} onPress={() => onPress(value)} />)}</>; }
function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [{ backgroundColor: active ? "#7C5CFC" : "#F4F1FA", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }, pressed && { opacity: 0.75 }]}><Text style={{ color: active ? "#FFFFFF" : "#777487", fontSize: 10, fontWeight: "800" }}>{label}</Text></Pressable>; }
function ActionButton({ icon, label, onPress, danger = false, loading = false }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; onPress: () => void; danger?: boolean; loading?: boolean }) { return <Pressable onPress={onPress} disabled={loading} style={({ pressed }) => [{ flex: 1, backgroundColor: danger ? "#FFF2F0" : "#F0ECFF", borderRadius: 11, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, pressed && { opacity: 0.7 }, loading && { opacity: 0.5 }]}><MaterialIcons name={icon} size={15} color={danger ? "#E76546" : "#6C4EE4"} /><Text style={{ color: danger ? "#E76546" : "#6C4EE4", fontSize: 10, fontWeight: "900" }}>{label}</Text></Pressable>; }
