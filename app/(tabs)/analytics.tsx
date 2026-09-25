import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { AppIcon, PieChart } from "@/components/finance-components";
import { ContextualHint } from "@/components/contextual-hint";
import { useFinance } from "@/lib/finance-store";
import { formatMoney, localeMeta, t } from "@/lib/i18n";
import { purchasePieChartUnlock } from "@/lib/bazaar-billing";
import { saveChartSnapshot } from "@/lib/chart-storage";
import { PurchaseSuccessModal } from "@/components/purchase-success-modal";
import { ChartSavedModal } from "@/components/chart-saved-modal";

const colors = ["#7C5CFC", "#FF8A65", "#4ECDC4", "#F5B544", "#58A6FF", "#B2A9C9"];

export default function AnalyticsScreen() {
  const { locale, transactions, pieUnlocked, unlockPie } = useFinance();
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const isRTL = localeMeta[locale].direction === "rtl";

  const expenses = useMemo(
    () => transactions.filter((item) => item.type === "expense"),
    [transactions]
  );

  const byCategory = useMemo(() => {
    const grouped = new Map<string, number>();
    expenses.forEach((item) =>
      grouped.set(item.category, (grouped.get(item.category) ?? 0) + item.amount)
    );
    return [...grouped.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, value], index) => ({
        category,
        value,
        color: colors[index % colors.length],
      }));
  }, [expenses]);

  const total = byCategory.reduce((sum, item) => sum + item.value, 0);

  const unlock = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const result = await purchasePieChartUnlock();
    if (result.status === "success") {
      unlockPie();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowSuccess(true);
    } else {
      Alert.alert(t(locale, "unlockWithBazaar"), t(locale, "paymentUnavailable"));
    }
  };

  const saveChart = async () => {
    if (!pieUnlocked || saving) return;
    setSaving(true);
    try {
      const snapshot = await saveChartSnapshot(transactions);
      setSavedAt(snapshot.savedAt);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowSaved(true);
    } catch {
      Alert.alert(t(locale, "paymentError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F8F7FC]" safeAreaClassName="bg-[#F8F7FC]">
      <ContextualHint
        screen="analytics"
        locale={locale}
        titleKey="analyticsHintTitle"
        bodyKey="analyticsHintBody"
        icon="pie-chart"
      />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={{ gap: 5, alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={{ color: "#9996A8", fontSize: 12, fontWeight: "600" }}>
            {t(locale, "thisMonth")}
          </Text>
          <Text style={{ color: "#28243E", fontSize: 28, fontWeight: "900" }}>
            {t(locale, "analytics")}
          </Text>
        </View>

        {/* Chart Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 26,
            padding: 20,
            marginTop: 20,
            borderWidth: 1,
            borderColor: "#EFEDF6",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "100%",
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#28243E", fontSize: 16, fontWeight: "900" }}>
              {t(locale, "categoryBreakdown")}
            </Text>
            <View
              style={{
                backgroundColor: "#F3F0FF",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 11,
              }}
            >
              <Text style={{ color: "#7659E9", fontSize: 10, fontWeight: "800" }}>
                {t(locale, "thisMonth")}
              </Text>
            </View>
          </View>

          {!pieUnlocked ? (
            <View style={{ alignItems: "center", paddingVertical: 27, gap: 14 }}>
              <View
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: 41,
                  backgroundColor: "#F0ECFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="lock-outline" color="#7C5CFC" size={34} />
              </View>
              <Text style={{ color: "#28243E", fontSize: 16, fontWeight: "900", textAlign: "center" }}>
                {t(locale, "pieChartLocked")}
              </Text>
              <Text style={{ color: "#9996A8", fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 270 }}>
                {t(locale, "unlockDescription")}
              </Text>
              <Pressable
                onPress={unlock}
                style={({ pressed }) => [
                  { backgroundColor: "#7C5CFC", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13, marginTop: 2 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900" }}>
                  {t(locale, "unlockWithBazaar")}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingTop: 25, width: "100%" }}>
              <View style={{ position: "relative" }}>
                <PieChart values={byCategory} size={190} />
                <View style={{ position: "absolute", top: 73, left: 50, width: 90, alignItems: "center" }}>
                  <Text style={{ color: "#9996A8", fontSize: 10, fontWeight: "700" }}>
                    {t(locale, "totalSpent")}
                  </Text>
                  <Text style={{ color: "#28243E", fontSize: 13, fontWeight: "900", marginTop: 4 }}>
                    {formatMoney(total, locale)}
                  </Text>
                </View>
              </View>

              <View style={{ width: "100%", gap: 12, marginTop: 22 }}>
                {byCategory.map((item) => (
                  <View
                    key={item.category}
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: item.color }} />
                      <Text style={{ color: "#777487", fontSize: 12, fontWeight: "700" }}>
                        {t(locale, item.category as never)}
                      </Text>
                    </View>
                    <Text style={{ color: "#28243E", fontSize: 12, fontWeight: "900" }}>
                      {formatMoney(item.value, locale)}
                    </Text>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={saveChart}
                disabled={saving}
                style={({ pressed }) => [
                  {
                    width: "100%",
                    marginTop: 20,
                    backgroundColor: "#F0ECFF",
                    borderRadius: 14,
                    paddingVertical: 13,
                    alignItems: "center",
                    flexDirection: isRTL ? "row-reverse" : "row",
                    justifyContent: "center",
                    gap: 8,
                  },
                  pressed && { opacity: 0.75 },
                  saving && { opacity: 0.55 },
                ]}
              >
                <AppIcon name="save-alt" color="#6C4EE4" size={18} />
                <Text style={{ color: "#6C4EE4", fontSize: 12, fontWeight: "900" }}>
                  {saving ? t(locale, "savingChart") : t(locale, "saveChart")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View
          style={{
            backgroundColor: "#292044",
            borderRadius: 22,
            padding: 18,
            marginTop: 16,
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 13,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: "#47366E",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppIcon name="auto-graph" color="#B8A8FF" size={21} />
          </View>
          <View style={{ flex: 1, gap: 5, alignItems: isRTL ? "flex-end" : "flex-start" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900" }}>
              {t(locale, "monthlyPulse")}
            </Text>
            <Text style={{ color: "#BEB6DC", fontSize: 11, lineHeight: 17, textAlign: isRTL ? "right" : "left" }}>
              {pieUnlocked ? t(locale, "premiumUnlocked") : t(locale, "oneTimePurchase")}
            </Text>
          </View>
        </View>

        {/* View Saved Reports Button */}
        {pieUnlocked ? (
          <Pressable
            onPress={() => router.push("/(tabs)/saved-reports")}
            style={({ pressed }) => [
              {
                marginTop: 16,
                backgroundColor: "#FFFFFF",
                borderRadius: 17,
                paddingVertical: 14,
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: "#EFEDF6",
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <AppIcon name="folder-open" color="#7C5CFC" size={18} />
            <Text style={{ color: "#6C4EE4", fontSize: 12, fontWeight: "900" }}>
              {t(locale, "viewSavedReports")}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <PurchaseSuccessModal visible={showSuccess} locale={locale} onClose={() => setShowSuccess(false)} />
      <ChartSavedModal visible={showSaved} locale={locale} savedAt={savedAt} onClose={() => setShowSaved(false)} />
    </ScreenContainer>
  );
}
