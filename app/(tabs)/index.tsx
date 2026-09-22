import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { AppIcon, styles as financeStyles, TransactionRow } from "@/components/finance-components";
import { BudgetProgress } from "@/components/budget-components";
import { useFinance } from "@/lib/finance-store";
import { useBudgets } from "@/lib/budget-store";
import { formatMoney, localeMeta, t } from "@/lib/i18n";
import { isInCurrentMonth } from "@/lib/budget-utils";
import { useChecks } from "@/lib/check-store";
import { getDueChecks, getDueChecksTotal } from "@/lib/check-summary-utils";

const triggerHaptic = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function HomeScreen() {
  const { locale, transactions, pieUnlocked } = useFinance();
  const { budgets } = useBudgets();
  const { checks } = useChecks();
  const isRTL = localeMeta[locale].direction === "rtl";
  const income = useMemo(() => transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), [transactions]);
  const expenses = useMemo(() => transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0), [transactions]);
  const balance = income - expenses;
  const spentByCategory = useMemo(() => transactions.filter((item) => item.type === "expense" && isInCurrentMonth(item.date)).reduce<Record<string, number>>((result, item) => ({ ...result, [item.category]: (result[item.category] ?? 0) + item.amount }), {}), [transactions]);
  const dueChecks = useMemo(() => getDueChecks(pieUnlocked ? checks : []), [checks, pieUnlocked]);
  const dueChecksTotal = useMemo(() => getDueChecksTotal(dueChecks), [dueChecks]);

  return (
    <ScreenContainer containerClassName="bg-[#F8F7FC]" safeAreaClassName="bg-[#F8F7FC]">
      <FlatList
        data={transactions.slice(0, 4)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 18, paddingTop: 10, paddingBottom: 8 }}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ alignItems: isRTL ? "flex-end" : "flex-start", gap: 4 }}>
                <Text style={{ color: "#9996A8", fontSize: 12, fontWeight: "600" }}>{t(locale, "greeting")}, آرمان</Text>
                <Text style={{ color: "#24203B", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>{t(locale, "overview")}</Text>
              </View>
              <View style={{ width: 46, height: 46, borderRadius: 18, backgroundColor: "#EDE8FF", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#7659E9", fontSize: 16, fontWeight: "900" }}>آ</Text>
              </View>
            </View>

            <View style={{ backgroundColor: "#292044", borderRadius: 28, padding: 22, minHeight: 185, overflow: "hidden" }}>
              <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 100, backgroundColor: "#3C2B68", right: -55, top: -80 }} />
              <View style={{ position: "absolute", width: 130, height: 130, borderRadius: 100, backgroundColor: "#36255D", left: -55, bottom: -60 }} />
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#BEB6DC", fontSize: 12, fontWeight: "700" }}>{t(locale, "balance")}</Text>
                <View style={{ backgroundColor: "#403365", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}><Text style={{ color: "#D7D1ED", fontSize: 10, fontWeight: "700" }}>{t(locale, "thisMonth")}</Text></View>
              </View>
              <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "900", marginTop: 12, textAlign: isRTL ? "right" : "left" }}>{formatMoney(balance, locale)}</Text>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 26, marginTop: 20 }}>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 7 }}><View style={{ width: 8, height: 8, borderRadius: 5, backgroundColor: "#68D9B6" }} /><Text style={{ color: "#BEB6DC", fontSize: 11 }}>{t(locale, "income")}</Text><Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>{formatMoney(income, locale)}</Text></View>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 7 }}><View style={{ width: 8, height: 8, borderRadius: 5, backgroundColor: "#FF9F86" }} /><Text style={{ color: "#BEB6DC", fontSize: 11 }}>{t(locale, "expenses")}</Text><Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>{formatMoney(expenses, locale)}</Text></View>
              </View>
            </View>

            <Pressable onPress={() => { triggerHaptic(); router.push("/transactions?add=1" as never); }} style={({ pressed }) => [{ backgroundColor: "#7C5CFC", borderRadius: 18, minHeight: 54, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 9 }, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}>
              <AppIcon name="add-circle-outline" color="#FFFFFF" size={21} /><Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>{t(locale, "addTransaction")}</Text>
            </Pressable>

            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#EFEDF6" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: pieUnlocked ? "#E5FAF2" : "#F0ECFF", alignItems: "center", justifyContent: "center" }}><AppIcon name={pieUnlocked ? "pie-chart" : "lock-outline"} color={pieUnlocked ? "#2EBD85" : "#7C5CFC"} size={19} /></View>
                  <View style={{ gap: 3, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#28243E", fontSize: 14, fontWeight: "800" }}>{pieUnlocked ? t(locale, "premiumUnlocked") : t(locale, "pieChartLocked")}</Text><Text style={{ color: "#A19DAE", fontSize: 11 }}>{pieUnlocked ? t(locale, "categoryBreakdown") : t(locale, "oneTimePurchase")}</Text></View>
                </View>
                {!pieUnlocked && <Text style={{ color: "#6C4EE4", fontSize: 11, fontWeight: "900" }}>{t(locale, "unlockWithBazaar")}</Text>}
              </View>
              {!pieUnlocked && <Text style={{ color: "#777487", lineHeight: 19, fontSize: 12, marginTop: 14, textAlign: isRTL ? "right" : "left" }}>{t(locale, "unlockDescription")}</Text>}
            </View>

            <Pressable onPress={() => router.push("/budgets" as never)} style={{ backgroundColor: "#FFFFFF", borderRadius: 24, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10, borderWidth: 1, borderColor: "#EFEDF6" }}>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}><View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 9 }}><View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#F0ECFF", alignItems: "center", justifyContent: "center" }}><AppIcon name="speed" color="#7C5CFC" size={18} /></View><View style={{ gap: 3, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#28243E", fontSize: 14, fontWeight: "900" }}>{t(locale, "monthlyBudgets")}</Text><Text style={{ color: "#9996A8", fontSize: 10 }}>{t(locale, "budgetControl")}</Text></View></View><Text style={{ color: "#7659E9", fontSize: 11, fontWeight: "900" }}>{t(locale, "seeAll")}</Text></View>
              {budgets.slice(0, 2).map((budget, index) => <BudgetProgress key={budget.id} budget={budget} spent={spentByCategory[budget.category] ?? 0} locale={locale} compact delay={index * 90} />)}
            </Pressable>

            <Pressable onPress={() => router.push("/checks" as never)} style={{ backgroundColor: "#FFF8EF", borderRadius: 22, padding: 17, borderWidth: 1, borderColor: "#F6E7CF" }}><View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}><View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 9 }}><View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: pieUnlocked ? "#FFE9C2" : "#F0ECFF", alignItems: "center", justifyContent: "center" }}><AppIcon name={pieUnlocked ? "description" : "lock-outline"} color={pieUnlocked ? "#D49320" : "#7C5CFC"} size={18} /></View><View style={{ gap: 3, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#6F4B13", fontSize: 14, fontWeight: "900" }}>{pieUnlocked ? t(locale, "dueChecks") : t(locale, "pieChartLocked")}</Text><Text style={{ color: "#A47C43", fontSize: 10 }}>{pieUnlocked ? (dueChecks.length ? t(locale, "dueChecksAmount") : t(locale, "noDueChecks")) : t(locale, "oneTimePurchase")}</Text></View></View>{pieUnlocked ? <Text style={{ color: "#B56F10", fontSize: 16, fontWeight: "900" }}>{formatMoney(dueChecksTotal, locale)}</Text> : <Text style={{ color: "#6C4EE4", fontSize: 10, fontWeight: "900" }}>{t(locale, "unlockWithBazaar")}</Text>}</View></Pressable>

            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}><Text style={{ color: "#28243E", fontSize: 17, fontWeight: "900" }}>{t(locale, "recentTransactions")}</Text><Pressable onPress={() => router.push("/transactions" as never)}><Text style={{ color: "#7659E9", fontSize: 12, fontWeight: "800" }}>{t(locale, "seeAll")}</Text></Pressable></View>
          </View>
        }
        renderItem={({ item }) => <TransactionRow item={item} locale={locale} />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#EEECF4" }} />}
        ListEmptyComponent={<Text style={{ color: "#9996A8", textAlign: "center", paddingVertical: 30 }}>{t(locale, "emptyTransactions")}</Text>}
      />
    </ScreenContainer>
  );
}
