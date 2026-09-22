import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { Locale } from "@/lib/i18n";

const choices: { locale: Locale; label: string; native: string; flag: string }[] = [
  { locale: "fa", label: "فارسی", native: "Persian", flag: "فا" },
  { locale: "en", label: "English", native: "English", flag: "EN" },
  { locale: "ar", label: "العربية", native: "Arabic", flag: "ع" },
  { locale: "tr", label: "Türkçe", native: "Turkish", flag: "TR" },
];

export function LanguageOnboardingModal({ visible, onSelect }: { visible: boolean; onSelect: (locale: Locale) => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}><View style={{ flex: 1, backgroundColor: "rgba(30,20,55,0.58)", alignItems: "center", justifyContent: "center", padding: 24 }}><View style={{ width: "100%", maxWidth: 380, backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, gap: 18 }}><View style={{ alignItems: "center", gap: 6 }}><View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: "#F0ECFF", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#7C5CFC", fontSize: 20, fontWeight: "900" }}>A</Text></View><Text style={{ color: "#28243E", fontSize: 22, fontWeight: "900", textAlign: "center" }}>Choose your language</Text><Text style={{ color: "#777487", fontSize: 12, textAlign: "center" }}>زبان برنامه را انتخاب کنید · اختر لغة التطبيق</Text></View><View style={{ gap: 10 }}>{choices.map((choice) => <Pressable key={choice.locale} onPress={() => onSelect(choice.locale)} style={({ pressed }) => [{ borderWidth: 1, borderColor: "#EEEAF7", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, pressed && { backgroundColor: "#F7F4FF", transform: [{ scale: 0.98 }] }]}><View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "#F0ECFF", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#6C4EE4", fontSize: 12, fontWeight: "900" }}>{choice.flag}</Text></View><View style={{ gap: 3 }}><Text style={{ color: "#28243E", fontSize: 15, fontWeight: "900" }}>{choice.label}</Text><Text style={{ color: "#9996A8", fontSize: 11 }}>{choice.native}</Text></View></Pressable>)}</View></View></View></Modal>;
}
