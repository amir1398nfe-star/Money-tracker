import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter, Modal, Pressable, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { localeMeta, t, type Locale } from "@/lib/i18n";

const TOUR_KEY = "pocket-budget-feature-tour-seen-v1";
export async function resetFeatureTour() { await AsyncStorage.removeItem(TOUR_KEY); DeviceEventEmitter.emit("pocket-budget-tour-reset"); }
const slides = [
  { icon: "receipt-long" as const, title: "tourTransactionsTitle" as const, body: "tourTransactionsBody" as const },
  { icon: "speed" as const, title: "tourBudgetTitle" as const, body: "tourBudgetBody" as const },
  { icon: "pie-chart" as const, title: "tourAnalyticsTitle" as const, body: "tourAnalyticsBody" as const },
  { icon: "description" as const, title: "tourChecksTitle" as const, body: "tourChecksBody" as const },
];

export function FeatureTourModal({ enabled, locale }: { enabled: boolean; locale: Locale }) {
  const [seen, setSeen] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const rtl = localeMeta[locale].direction === "rtl";
  useEffect(() => { AsyncStorage.getItem(TOUR_KEY).then((value) => setSeen(value === "1")).catch(() => setSeen(false)); const listener = DeviceEventEmitter.addListener("pocket-budget-tour-reset", () => { setStep(0); setSeen(false); }); return () => listener.remove(); }, []);
  const slide = useMemo(() => slides[step], [step]);
  const finish = async () => { setSeen(true); await AsyncStorage.setItem(TOUR_KEY, "1"); };
  const next = () => step === slides.length - 1 ? void finish() : setStep((value) => value + 1);
  const visible = enabled && seen === false;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={finish}><View style={{ flex: 1, backgroundColor: "rgba(30,20,55,0.62)", alignItems: "center", justifyContent: "center", padding: 24 }}><View style={{ width: "100%", maxWidth: 390, backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, gap: 22 }}><View style={{ flexDirection: rtl ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ color: "#9996A8", fontSize: 11, fontWeight: "800" }}>{step + 1} / {slides.length}</Text><Pressable onPress={finish}><Text style={{ color: "#7C5CFC", fontSize: 11, fontWeight: "900" }}>{t(locale, "tourSkip")}</Text></Pressable></View><View style={{ alignItems: "center", gap: 14 }}><View style={{ width: 76, height: 76, borderRadius: 26, backgroundColor: "#F0ECFF", alignItems: "center", justifyContent: "center" }}><MaterialIcons name={slide.icon} size={38} color="#7C5CFC" /></View><Text style={{ color: "#28243E", fontSize: 22, fontWeight: "900", textAlign: "center" }}>{t(locale, slide.title)}</Text><Text style={{ color: "#777487", fontSize: 13, lineHeight: 22, textAlign: "center" }}>{t(locale, slide.body)}</Text></View><View style={{ flexDirection: rtl ? "row-reverse" : "row", gap: 7, justifyContent: "center" }}>{slides.map((_, index) => <View key={index} style={{ width: index === step ? 24 : 7, height: 7, borderRadius: 5, backgroundColor: index === step ? "#7C5CFC" : "#E4DFF4" }} />)}</View><Pressable onPress={next} style={({ pressed }) => [{ backgroundColor: "#7C5CFC", borderRadius: 15, paddingVertical: 15, alignItems: "center" }, pressed && { opacity: 0.82 }]}><Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "900" }}>{step === slides.length - 1 ? t(locale, "tourStart") : t(locale, "tourNext")}</Text></Pressable></View></View></Modal>;
}
