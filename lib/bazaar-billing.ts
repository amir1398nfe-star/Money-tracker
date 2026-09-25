import { Platform } from "react-native";

export const BAZAAR_PIE_SKU = process.env.EXPO_PUBLIC_BAZAAR_PIE_SKU || "premium_pie_chart";

export type BillingResult =
  | { status: "success"; purchaseToken?: string }
  | { status: "unavailable"; reason: "preview" | "not_configured" | "sdk_error" };

/** Mock function for billing when Bazaar SDK is temporarily removed */
export async function purchasePieChartUnlock(): Promise<BillingResult> {
  if (Platform.OS !== "android") return { status: "unavailable", reason: "preview" };
  return { status: "unavailable", reason: "sdk_error" };
}

/** Mock function for restore when Bazaar SDK is temporarily removed */
export async function restorePieChartUnlock(): Promise<BillingResult> {
  if (Platform.OS !== "android") return { status: "unavailable", reason: "preview" };
  return { status: "unavailable", reason: "sdk_error" };
}
