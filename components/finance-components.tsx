import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { formatMoney, formatShortDate, t, type Locale } from "@/lib/i18n";
import type { Transaction } from "@/lib/finance-store";

export function AppIcon({ name, color = "#7C5CFC", size = 22 }: { name: React.ComponentProps<typeof MaterialIcons>["name"]; color?: string; size?: number }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

export function TransactionRow({ item, locale }: { item: Transaction; locale: Locale }) {
  const isIncome = item.type === "income";
  const title = item.title || t(locale, item.category as never);
  return (
    <View style={styles.transactionRow}>
      <View style={[styles.transactionIcon, { backgroundColor: `${item.color}1A` }]}>
        <AppIcon name={isIncome ? "arrow-downward" : "shopping-bag"} color={item.color} size={19} />
      </View>
      <View style={styles.transactionMain}>
        <Text style={styles.transactionTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.transactionDate}>{formatShortDate(item.date, locale)} · {t(locale, item.category as never)}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: isIncome ? "#2EBD85" : "#232138" }]}>
        {isIncome ? "+" : "−"}{formatMoney(item.amount, locale).replace(" تومان", "").replace(" Toman", "")}
      </Text>
    </View>
  );
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) };
  const end = { x: cx + radius * Math.cos(endAngle), y: cy + radius * Math.sin(endAngle) };
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

export function PieChart({ values, size = 190 }: { values: { value: number; color: string }[]; size?: number }) {
  const total = values.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <View style={[styles.emptyChart, { width: size, height: size }]}><Text style={styles.emptyChartText}>—</Text></View>;
  let currentAngle = -Math.PI / 2;
  const radius = size / 2 - 5;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G>
        {values.map((item, index) => {
          const sweep = (item.value / total) * Math.PI * 2;
          const path = describeArc(size / 2, size / 2, radius, currentAngle, currentAngle + sweep - 0.025);
          currentAngle += sweep;
          return <Path key={`${item.color}-${index}`} d={path} fill={item.color} />;
        })}
        <Circle cx={size / 2} cy={size / 2} r={size * 0.29} fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

export const styles = StyleSheet.create({
  transactionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  transactionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  transactionMain: { flex: 1, gap: 4 },
  transactionTitle: { color: "#26223B", fontSize: 14, fontWeight: "700" },
  transactionDate: { color: "#9996A8", fontSize: 11, fontWeight: "500" },
  transactionAmount: { fontSize: 13, fontWeight: "800" },
  emptyChart: { borderRadius: 100, backgroundColor: "#F0EEF7", alignItems: "center", justifyContent: "center" },
  emptyChartText: { color: "#AAA6B8", fontSize: 30 },
});
