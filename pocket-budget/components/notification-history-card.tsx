import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getNotificationHistory, clearNotificationHistory, type NotificationHistoryItem } from "@/lib/notification-history";
import { localeMeta, t, type Locale } from "@/lib/i18n";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export function NotificationHistoryCard({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<NotificationHistoryItem[]>([]); const isRTL = localeMeta[locale].direction === "rtl";
  const refresh = () => getNotificationHistory().then((value) => setItems(value.slice(0, 5)));
  useEffect(() => { refresh(); }, []);
  const clear = async () => { await clearNotificationHistory(); setItems([]); };
  return <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, marginTop: 16, borderWidth: 1, borderColor: "#EFEDF6", gap: 12 }}><View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}><View style={{ flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 9 }}><MaterialIcons name="history" size={21} color="#7C5CFC" /><Text style={{ color: "#28243E", fontSize: 14, fontWeight: "900" }}>{t(locale, "notificationHistory")}</Text></View>{items.length > 0 && <Pressable onPress={clear}><Text style={{ color: "#E76546", fontSize: 10, fontWeight: "900" }}>{t(locale, "clearHistory")}</Text></Pressable>}</View>{items.length === 0 ? <Text style={{ color: "#9996A8", fontSize: 11, textAlign: isRTL ? "right" : "left" }}>{t(locale, "noNotificationHistory")}</Text> : items.map((item) => <View key={item.id} style={{ borderTopWidth: 1, borderTopColor: "#F0EEF6", paddingTop: 9, gap: 3, alignItems: isRTL ? "flex-end" : "flex-start" }}><Text style={{ color: "#28243E", fontSize: 11, fontWeight: "800" }}>{item.title}</Text><Text style={{ color: "#777487", fontSize: 10, textAlign: isRTL ? "right" : "left" }}>{item.body}</Text><Text style={{ color: "#AAA6B8", fontSize: 9 }}>{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale === "ar" ? "ar-IQ" : locale === "tr" ? "tr-TR" : "en-US", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.receivedAt))}</Text></View>)}</View>;
}
