import React, { useEffect } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { AppIcon } from "@/components/finance-components";
import { localeMeta, t, type Locale } from "@/lib/i18n";

const confetti = ["#7C5CFC", "#FF8A65", "#4ECDC4", "#F5B544", "#58A6FF", "#E76546"];

export function PurchaseSuccessModal({ visible, locale, onClose }: { visible: boolean; locale: Locale; onClose: () => void }) {
  const scale = useSharedValue(0.72);
  const opacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const isRTL = localeMeta[locale].direction === "rtl";

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220 });
      scale.value = withSequence(withTiming(1.06, { duration: 280, easing: Easing.out(Easing.cubic) }), withTiming(1, { duration: 180 }));
      checkScale.value = withDelay(220, withSequence(withTiming(1.15, { duration: 230, easing: Easing.out(Easing.cubic) }), withTiming(1, { duration: 150 })));
    } else {
      opacity.value = withTiming(0, { duration: 160 });
      scale.value = withTiming(0.92, { duration: 160 });
      checkScale.value = withTiming(0, { duration: 100 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[{ flex: 1, backgroundColor: "rgba(30, 20, 55, 0.58)", alignItems: "center", justifyContent: "center", padding: 24 }, backdropStyle]}>
        {confetti.map((color, index) => <View key={`${color}-${index}`} style={{ position: "absolute", width: 9, height: 16, borderRadius: 4, backgroundColor: color, top: `${18 + (index % 3) * 8}%`, left: index % 2 === 0 ? `${10 + index * 5}%` : undefined, right: index % 2 === 1 ? `${10 + (index - 1) * 5}%` : undefined, transform: [{ rotate: `${index % 2 === 0 ? 22 : -26}deg` }] }} />)}
        <Animated.View style={[{ width: "100%", maxWidth: 360, backgroundColor: "#FFFFFF", borderRadius: 30, padding: 25, alignItems: "center", gap: 15 }, cardStyle]}>
          <Animated.View style={[{ width: 86, height: 86, borderRadius: 43, backgroundColor: "#E5FAF2", alignItems: "center", justifyContent: "center", borderWidth: 7, borderColor: "#F1FCF7" }, checkStyle]}><AppIcon name="check" color="#2EBD85" size={43} /></Animated.View>
          <Text style={{ color: "#28243E", fontSize: 21, fontWeight: "900", textAlign: "center", marginTop: 2 }}>{t(locale, "purchaseCongratsTitle")}</Text>
          <Text style={{ color: "#777487", fontSize: 13, lineHeight: 21, textAlign: "center", direction: isRTL ? "rtl" : "ltr" }}>{t(locale, "purchaseCongratsMessage")}</Text>
          <View style={{ width: "100%", backgroundColor: "#F8F5FF", borderRadius: 16, padding: 13, flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}><AppIcon name="pie-chart" color="#7C5CFC" size={19} /><Text style={{ color: "#6C4EE4", fontSize: 12, fontWeight: "900" }}>{t(locale, "premiumUnlocked")}</Text></View>
          <Pressable onPress={onClose} style={({ pressed }) => [{ width: "100%", backgroundColor: "#7C5CFC", borderRadius: 15, paddingVertical: 15, alignItems: "center", marginTop: 2 }, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}><Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "900" }}>{t(locale, "continueToChart")}</Text></Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
