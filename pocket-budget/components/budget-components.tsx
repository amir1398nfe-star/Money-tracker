import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { formatMoney, t, type Locale } from "@/lib/i18n";
import type { Budget } from "@/lib/budget-store";
import { getBudgetPercentage } from "@/lib/budget-utils";

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

export function useCountUp(target: number, duration = 720, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const startAnimation = () => {
      const startedAt = Date.now();
      const tick = () => {
        const progress = Math.min((Date.now() - startedAt) / duration, 1);
        setValue(target * easeOutCubic(progress));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    timeout = setTimeout(startAnimation, delay);
    return () => {
      if (timeout) clearTimeout(timeout);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target, duration, delay]);
  return value;
}

export function BudgetProgress({ budget, spent, locale, compact = false, delay = 0 }: { budget: Budget; spent: number; locale: Locale; compact?: boolean; delay?: number }) {
  const percentage = getBudgetPercentage(spent, budget.limit);
  const progress = Math.min(percentage, 100);
  const isOver = percentage >= 100;
  const isWarning = percentage >= 80 && !isOver;
  const progressColor = isOver ? "#E76546" : isWarning ? "#F5B544" : budget.color;
  const animatedSpent = useCountUp(spent, 720, delay);
  const animatedPercentage = useCountUp(percentage, 720, delay);
  const warningShake = useSharedValue(0);
  useEffect(() => {
    if (isOver) {
      warningShake.value = withSequence(
        withTiming(-2, { duration: 55 }),
        withTiming(2, { duration: 55 }),
        withTiming(-1.5, { duration: 45 }),
        withTiming(1.5, { duration: 45 }),
        withTiming(0, { duration: 55 }),
      );
    } else {
      warningShake.value = withTiming(0, { duration: 120 });
    }
  }, [isOver]);
  const warningStyle = useAnimatedStyle(() => ({ transform: [{ translateX: warningShake.value }] }));
  const animatedProgress = useSharedValue(0);
  useEffect(() => {
    animatedProgress.value = withDelay(delay, withTiming(progress, { duration: 720, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${animatedProgress.value}%` }));
  return (
    <Animated.View style={[{ gap: compact ? 7 : 9, paddingVertical: compact ? 8 : 12, paddingHorizontal: isOver ? 8 : 0, borderRadius: 14, backgroundColor: isOver ? "#FFF3F0" : "transparent" }, warningStyle]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={{ width: compact ? 9 : 11, height: compact ? 9 : 11, borderRadius: 6, backgroundColor: budget.color }} />
          <Text style={{ color: "#28243E", fontSize: compact ? 12 : 14, fontWeight: "800" }} numberOfLines={1}>{t(locale, budget.category as never)}</Text>
        </View>
        <Text style={{ color: isOver ? "#E76546" : "#777487", fontSize: compact ? 10 : 11, fontWeight: "800" }}>{formatMoney(animatedSpent, locale)} / {formatMoney(budget.limit, locale)}</Text>
      </View>
      <View style={{ height: compact ? 7 : 10, backgroundColor: "#F0EEF6", borderRadius: 10, overflow: "hidden" }}><Animated.View style={[{ height: "100%", backgroundColor: progressColor, borderRadius: 10 }, progressStyle]} /></View>
      <Text style={{ color: isOver ? "#E76546" : isWarning ? "#B17B11" : "#9996A8", fontSize: 10, fontWeight: "700" }}>{isOver ? `${Math.round(animatedPercentage)}% · ${t(locale, "budgetExceeded")}` : `${Math.round(animatedPercentage)}% · ${t(locale, "budgetRemaining")} ${formatMoney(Math.max(budget.limit - animatedSpent, 0), locale)}`}</Text>
    </Animated.View>
  );
}
