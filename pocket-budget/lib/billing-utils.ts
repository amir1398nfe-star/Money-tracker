export type PurchaseRecord = { productId?: string; purchaseToken?: string };

export function hasPurchasedProduct(purchases: PurchaseRecord[], sku: string) {
  return purchases.some((purchase) => purchase.productId === sku);
}
