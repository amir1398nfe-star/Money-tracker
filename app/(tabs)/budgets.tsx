import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppIcon } from "@/components/finance-components";
import { BudgetProgress } from "@/components/budget-components";
import { ContextualHint } from "@/components/contextual-hint";
import { useBudgets } from "@/lib/budget-store";
import { useFinance } from "@/lib/finance-store";
import { formatMoney, localeMeta, t } from "@/lib/i18n";
import { isInCurrentMonth } from "@/lib/budget-utils";

export default function BudgetsScreen() {
  const { locale, transactions } = useFinance();
  const { budgets, setBudgetLimit } = useBudgets();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLimit, setDraftLimit] = useState("");
  const isRTL = localeMeta[locale].direction === "rtl";
  const spentByCategory = useMemo(() => transactions.filter((item) => item.type === "expense" && isInCurrentMonth(item.date)).reduce<Record<string, number>>((result, item) => ({ ...result, [item.category]: (result[item.category] ?? 0) + item.amount }), {}), [transactions]);
  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (spentByCategory[budget.category] ?? 0), 0);
  const overallPercent = totalLimit ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const overallColor = overallPercent >= 100 ? "#E76546" : overallPercent >= 80 ? "#F5B544" : "#7C5CFC";

  const openEdit = (id: string, limit: number) => { setEditingId(id); setDraftLimit(String(limit)); };
  const save = () => {
    const value = Number(draftLimit.replace(/[^0-9]/g, ""));
    if (!editingId || !value) return;
    setBudgetLimit(editingId, value);
    setEditingId(null);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t(locale, "budgetSaved"));
  };

  return (
    <ScreenContainer containerClassName="bg-[#F8F7FC]" safeAreaClassName="bg-[#F8F7FC]">
      <ContextualHint screen="budgets" locale={locale} titleKey="budgetsHintTitle" bodyKey="budgetsHintBody" icon="speed" />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}><View style={{ gap: 5, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#9996A8", fontSize: 12, fontWeight: "600" }}>{t(locale, "thisMonth")}</Text><Text style={{ color: "#28243E", fontSize: 28, fontWeight: "900" }}>{t(locale, "monthlyBudgets")}</Text></View><View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "#EDE8FF", alignItems: "center", justifyContent: "center" }}><AppIcon name="speed" color="#7C5CFC" size={25} /></View></View>
        <View style={{ backgroundColor: "#292044", borderRadius: 25, padding: 20, marginTop: 20, gap: 17 }}><View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}><View style={{ gap: 5, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#BEB6DC", fontSize: 11, fontWeight: "700" }}>{t(locale, "budgetControl")}</Text><Text style={{ color: "#FFFFFF", fontSize: 21, fontWeight: "900" }}>{formatMoney(totalSpent, locale)}</Text></View><View style={{ alignItems: "center", justifyContent: "center", width: 58, height: 58, borderRadius: 30, borderWidth: 5, borderColor: overallColor, backgroundColor: "#3A2D5F" }}><Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900" }}>{overallPercent}%</Text></View></View><View style={{ height: 11, backgroundColor: "#443461", borderRadius: 10, overflow: "hidden" }}><View style={{ width: `${Math.min(overallPercent, 100)}%`, height: "100%", backgroundColor: overallColor, borderRadius: 10 }} /></View><View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between" }}><Text style={{ color: "#BEB6DC", fontSize: 11 }}>{t(locale, "budgetUsed")}</Text><Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900" }}>{formatMoney(totalLimit, locale)} · {t(locale, "totalBudget")}</Text></View></View>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginTop: 25, marginBottom: 5 }}><Text style={{ color: "#28243E", fontSize: 17, fontWeight: "900" }}>{t(locale, "budgets")}</Text><Text style={{ color: "#9996A8", fontSize: 11, fontWeight: "700" }}>{budgets.length} دسته</Text></View>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, paddingHorizontal: 17, borderWidth: 1, borderColor: "#EFEDF6" }}>{budgets.map((budget, index) => <View key={budget.id} style={{ borderBottomWidth: index === budgets.length - 1 ? 0 : 1, borderBottomColor: "#F0EEF6", paddingVertical: 7 }}><BudgetProgress budget={budget} spent={spentByCategory[budget.category] ?? 0} locale={locale} delay={index * 110} /><Pressable onPress={() => openEdit(budget.id, budget.limit)} style={({ pressed }) => [{ position: "absolute", top: 12, right: isRTL ? undefined : 0, left: isRTL ? 0 : undefined, padding: 5 }, pressed && { opacity: 0.5 }]}><AppIcon name="edit" color="#AAA6B8" size={16} /></Pressable></View>)}</View>
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10, backgroundColor: "#F0ECFF", borderRadius: 18, padding: 15, marginTop: 16 }}><AppIcon name="lightbulb-outline" color="#7C5CFC" size={20} /><Text style={{ color: "#6856A9", fontSize: 11, lineHeight: 18, flex: 1, textAlign: isRTL ? "right" : "left" }}>{overallPercent >= 80 ? t(locale, "budgetExceeded") : t(locale, "budgetRemaining")}</Text></View>
      </ScrollView>
      <Modal visible={editingId !== null} transparent animationType="fade" onRequestClose={() => setEditingId(null)}><View style={{ flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(26,20,46,0.35)" }}><View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, gap: 16 }}><View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ color: "#28243E", fontSize: 18, fontWeight: "900" }}>{t(locale, "editBudget")}</Text><Pressable onPress={() => setEditingId(null)}><AppIcon name="close" color="#9996A8" size={22} /></Pressable></View><Text style={{ color: "#777487", fontSize: 12, textAlign: isRTL ? "right" : "left" }}>{t(locale, "budgetLimit")}</Text><TextInput value={draftLimit} onChangeText={setDraftLimit} keyboardType="numeric" placeholder="2500000" placeholderTextColor="#B1ADBC" style={{ backgroundColor: "#F8F7FC", borderRadius: 14, paddingHorizontal: 15, paddingVertical: 13, color: "#28243E", fontSize: 14, textAlign: isRTL ? "right" : "left" }} /><Pressable onPress={save} style={({ pressed }) => [{ backgroundColor: "#7C5CFC", borderRadius: 14, paddingVertical: 14, alignItems: "center" }, pressed && { opacity: 0.8 }]}><Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{t(locale, "saveBudget")}</Text></Pressable></View></View></Modal>
    </ScreenContainer>
  );
}
