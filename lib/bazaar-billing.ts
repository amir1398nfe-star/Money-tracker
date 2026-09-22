import { Platform } from "react-native";
import { hasPurchasedProduct, type PurchaseRecord } from "@/lib/billing-utils";

export const BAZAAR_PIE_SKU = process.env.EXPO_PUBLIC_BAZAAR_PIE_SKU || "premium_pie_chart";

export type BillingResult =
  | { status: "success"; purchaseToken?: string }
  | { status: "unavailable"; reason: "preview" | "not_configured" | "sdk_error" };

type PurchaseSdk = {
  connect: (key: string) => Promise<void>;
  disconnect: () => Promise<void>;
  purchaseProduct?: (sku: string) => Promise<{ purchaseToken?: string }>;
  getPurchasedProducts?: () => Promise<Array<{ productId?: string; purchaseToken?: string }>>;
};

function getSdk(): PurchaseSdk {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require("@cafebazaar/react-native-poolakey");
  const sdk = (module.default || module) as PurchaseSdk | undefined;
  if (!sdk) throw new Error("Bazaar SDK unavailable");
  return sdk;
}

/** Connects to Poolakey and starts the one-time Bazaar purchase for the pie chart. */
export async function purchasePieChartUnlock(): Promise<BillingResult> {
  if (Platform.OS !== "android") return { status: "unavailable", reason: "preview" };
  const rsaKey = process.env.EXPO_PUBLIC_BAZAAR_RSA_KEY;
  if (!rsaKey) return { status: "unavailable", reason: "not_configured" };

  let bazaar: PurchaseSdk | undefined;
  try {
    bazaar = getSdk();
    await bazaar.connect(rsaKey);
    if (!bazaar.purchaseProduct) throw new Error("Purchase API unavailable");
    const result = await bazaar.purchaseProduct(BAZAAR_PIE_SKU);
    return { status: "success", purchaseToken: result?.purchaseToken };
  } catch {
    return { status: "unavailable", reason: "sdk_error" };
  } finally {
    if (bazaar) await bazaar.disconnect().catch(() => undefined);
  }
}

/** Restores a previously completed purchase so reinstall/restart cannot lose paid access. */
export async function restorePieChartUnlock(): Promise<BillingResult> {
  if (Platform.OS !== "android") return { status: "unavailable", reason: "preview" };
  const rsaKey = process.env.EXPO_PUBLIC_BAZAAR_RSA_KEY;
  if (!rsaKey) return { status: "unavailable", reason: "not_configured" };

  let bazaar: PurchaseSdk | undefined;
  try {
    bazaar = getSdk();
    await bazaar.connect(rsaKey);
    if (!bazaar.getPurchasedProducts) throw new Error("Restore API unavailable");
    const purchases = await bazaar.getPurchasedProducts();
    const purchase = purchases.find((item) => item.productId === BAZAAR_PIE_SKU);
    return hasPurchasedProduct(purchases as PurchaseRecord[], BAZAAR_PIE_SKU) ? { status: "success", purchaseToken: purchase?.purchaseToken } : { status: "unavailable", reason: "sdk_error" };
  } catch {
    return { status: "unavailable", reason: "sdk_error" };
  } finally {
    if (bazaar) await bazaar.disconnect().catch(() => undefined);
  }
}
