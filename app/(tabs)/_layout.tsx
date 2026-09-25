import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

import { useColors } from "@/hooks/use-colors";
import { FinanceProvider, useFinance } from "@/lib/finance-store";
import { t } from "@/lib/i18n";
import { BudgetProvider } from "@/lib/budget-store";
import { CheckProvider } from "@/lib/check-store";
import { LanguageOnboardingModal } from "@/components/language-onboarding-modal";
import { FeatureTourModal } from "@/components/feature-tour-modal";
import { BiometricLockOverlay } from "@/components/biometric-lock-overlay";
import { useBiometricAppLock } from "@/lib/biometric-lock";
import { recordNotification } from "@/lib/notification-history";

function TabsNavigator() {
  const colors = useColors();
  const { locale, isReady, hasSelectedLocale, setLocale, biometricEnabled } = useFinance();
  const { locked, unlock } = useBiometricAppLock(biometricEnabled, locale);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === "web") return;

    const listener = Notifications.addNotificationReceivedListener((notification) => {
      recordNotification({
        title: notification.request.content.title ?? "",
        body: notification.request.content.body ?? "",
        kind: String(notification.request.content.data?.reminder ?? "general"),
      });
    });

    return () => listener.remove();
  }, []);

  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + bottomPadding;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#7C5CFC",
          tabBarInactiveTintColor: "#AAA6B8",
          tabBarStyle: {
            paddingTop: 7,
            paddingBottom: bottomPadding,
            height: tabBarHeight,
            backgroundColor: colors.background,
            borderTopColor: "#EFEDF6",
            borderTopWidth: 0.5,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t(locale, "home"),
            tabBarIcon: ({ color }) => <MaterialIcons name="home-filled" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: t(locale, "transactions"),
            tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="checks"
          options={{
            title: t(locale, "checks"),
            tabBarIcon: ({ color }) => <MaterialIcons name="description" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: t(locale, "budgets"),
            tabBarIcon: ({ color }) => <MaterialIcons name="speed" size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: t(locale, "analytics"),
            tabBarIcon: ({ color }) => <MaterialIcons name="pie-chart" size={22} color={color} />,
          }}
        />
        <Tabs.Screen name="saved-reports" options={{ href: null }} />
        <Tabs.Screen
          name="settings"
          options={{
            title: t(locale, "settings"),
            tabBarIcon: ({ color }) => <MaterialIcons name="tune" size={22} color={color} />,
          }}
        />
      </Tabs>

      <LanguageOnboardingModal visible={isReady && !hasSelectedLocale} onSelect={setLocale} />
      <FeatureTourModal enabled={isReady && hasSelectedLocale} locale={locale} />
      <BiometricLockOverlay visible={isReady && locked} locale={locale} onUnlock={unlock} />
    </>
  );
}

export default function TabLayout() {
  return (
    <FinanceProvider>
      <BudgetProvider>
        <CheckProvider>
          <TabsNavigator />
        </CheckProvider>
      </BudgetProvider>
    </FinanceProvider>
  );
}
