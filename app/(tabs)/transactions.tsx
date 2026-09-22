import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppIcon, TransactionRow } from "@/components/finance-components";
import { ContextualHint } from "@/components/contextual-hint";
import { useFinance } from "@/lib/finance-store";
import { localeMeta, t } from "@/lib/i18n";

const categoryColors: Record<string, string> = { groceries: "#FF8A65", bills: "#4ECDC4", cafe: "#F5B544", transport: "#58A6FF", salary: "#7C5CFC", other: "#B2A9C9" };
const categoryKeys = ["groceries", "bills", "cafe", "transport", "salary", "other"] as const;

export default function TransactionsScreen() {
  const { locale, transactions, addTransaction } = useFinance();
  const params = useLocalSearchParams<{ add?: string }>();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState<string>("groceries");
  const isRTL = localeMeta[locale].direction === "rtl";

  useEffect(() => { if (params.add === "1") setShowForm(true); }, [params.add]);

  const total = useMemo(() => transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0), [transactions]);
  const openForm = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowForm(true); };
  const save = () => {
    const numericAmount = Number(amount.replace(/[^0-9]/g, ""));
    if (!title.trim() || !numericAmount) { Alert.alert(t(locale, "newTransaction"), t(locale, "amountPlaceholder")); return; }
    addTransaction({ title: title.trim(), amount: numericAmount, type, category, color: categoryColors[category] });
    setTitle(""); setAmount(""); setType("expense"); setCategory("groceries"); setShowForm(false);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScreenContainer containerClassName="bg-[#F8F7FC]" safeAreaClassName="bg-[#F8F7FC]">
      <ContextualHint screen="transactions" locale={locale} titleKey="transactionsHintTitle" bodyKey="transactionsHintBody" icon="receipt-long" />
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={{ paddingTop: 14, paddingBottom: 18, gap: 18 }}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}><View style={{ gap: 4, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#9996A8", fontSize: 12, fontWeight: "600" }}>{t(locale, "thisMonth")}</Text><Text style={{ color: "#28243E", fontSize: 28, fontWeight: "900" }}>{t(locale, "transactions")}</Text></View><Pressable onPress={openForm} style={({ pressed }) => [{ width: 48, height: 48, borderRadius: 16, backgroundColor: "#7C5CFC", alignItems: "center", justifyContent: "center" }, pressed && { opacity: 0.8 }]}><AppIcon name="add" color="#FFFFFF" size={25} /></Pressable></View>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#EFEDF6", flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}><View style={{ gap: 6, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#9996A8", fontSize: 11, fontWeight: "700" }}>{t(locale, "totalSpent")}</Text><Text style={{ color: "#28243E", fontSize: 22, fontWeight: "900" }}>{new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale === "tr" ? "tr-TR" : "en-US").format(total)}</Text></View><View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFF1ED", alignItems: "center", justifyContent: "center" }}><AppIcon name="trending-down" color="#FF8A65" size={22} /></View></View>
        </View>}
        renderItem={({ item }) => <TransactionRow item={item} locale={locale} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#EEECF4" }} />}
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(26,20,46,0.3)" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 30, gap: 17 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ color: "#28243E", fontSize: 20, fontWeight: "900" }}>{t(locale, "newTransaction")}</Text><Pressable onPress={() => setShowForm(false)}><AppIcon name="close" color="#9996A8" size={23} /></Pressable></View>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}><Pressable onPress={() => setType("expense")} style={[{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", borderWidth: 1 }, type === "expense" ? { backgroundColor: "#FFF1ED", borderColor: "#FF8A65" } : { borderColor: "#EEEAF5" }]}><Text style={{ color: type === "expense" ? "#E76546" : "#9996A8", fontWeight: "800", fontSize: 12 }}>{t(locale, "expense")}</Text></Pressable><Pressable onPress={() => setType("income")} style={[{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", borderWidth: 1 }, type === "income" ? { backgroundColor: "#E5FAF2", borderColor: "#2EBD85" } : { borderColor: "#EEEAF5" }]}><Text style={{ color: type === "income" ? "#218A63" : "#9996A8", fontWeight: "800", fontSize: 12 }}>{t(locale, "incomeType")}</Text></Pressable></View>
            <TextInput value={title} onChangeText={setTitle} placeholder={t(locale, "titlePlaceholder")} placeholderTextColor="#B1ADBC" style={{ backgroundColor: "#F8F7FC", borderRadius: 14, paddingHorizontal: 15, paddingVertical: 13, color: "#28243E", textAlign: isRTL ? "right" : "left", fontSize: 13 }} />
            <TextInput value={amount} onChangeText={setAmount} placeholder={t(locale, "amountPlaceholder")} placeholderTextColor="#B1ADBC" keyboardType="numeric" style={{ backgroundColor: "#F8F7FC", borderRadius: 14, paddingHorizontal: 15, paddingVertical: 13, color: "#28243E", textAlign: isRTL ? "right" : "left", fontSize: 13 }} />
            <View style={{ gap: 9 }}><Text style={{ color: "#777487", fontSize: 12, fontWeight: "700", textAlign: isRTL ? "right" : "left" }}>{t(locale, "category")}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" }}>{categoryKeys.map((key) => <Pressable key={key} onPress={() => setCategory(key)} style={[{ borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1 }, category === key ? { backgroundColor: `${categoryColors[key]}18`, borderColor: categoryColors[key] } : { backgroundColor: "#FFFFFF", borderColor: "#EEEAF5" }]}><Text style={{ color: category === key ? categoryColors[key] : "#9996A8", fontSize: 11, fontWeight: "800" }}>{t(locale, key as never)}</Text></Pressable>)}</View></View>
            <Pressable onPress={save} style={({ pressed }) => [{ backgroundColor: "#7C5CFC", borderRadius: 15, paddingVertical: 15, alignItems: "center" }, pressed && { opacity: 0.85 }]}><Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 14 }}>{t(locale, "save")}</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
