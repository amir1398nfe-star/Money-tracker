import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Transaction } from "@/lib/finance-store";

const CHART_SNAPSHOT_KEY = "pocket-budget-paid-chart-snapshots-v2";
const LEGACY_CHART_SNAPSHOT_KEY = "pocket-budget-paid-chart-snapshot-v1";

export type ChartSnapshot = {
  id: string;
  savedAt: string;
  categories: Record<string, number>;
  title?: string;
};

export async function getSavedChartSnapshots(): Promise<ChartSnapshot[]> {
  const raw = await AsyncStorage.getItem(CHART_SNAPSHOT_KEY);
  if (!raw) {
    const legacyRaw = await AsyncStorage.getItem(LEGACY_CHART_SNAPSHOT_KEY);
    if (!legacyRaw) return [];
    try {
      const legacy = JSON.parse(legacyRaw) as { savedAt?: string; categories?: Record<string, number> };
      return legacy.categories ? [{ id: "legacy", savedAt: legacy.savedAt ?? new Date().toISOString(), categories: legacy.categories }] : [];
    } catch { return []; }
  }
  try {
    const parsed = JSON.parse(raw) as ChartSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function persist(reports: ChartSnapshot[]) {
  await AsyncStorage.setItem(CHART_SNAPSHOT_KEY, JSON.stringify(reports.slice(0, 20)));
}

export async function saveChartSnapshot(transactions: Transaction[]): Promise<ChartSnapshot> {
  const categories = transactions.filter((item) => item.type === "expense").reduce<Record<string, number>>((result, item) => ({ ...result, [item.category]: (result[item.category] ?? 0) + item.amount }), {});
  const snapshot: ChartSnapshot = { id: `${Date.now()}`, savedAt: new Date().toISOString(), categories };
  await persist([snapshot, ...(await getSavedChartSnapshots())]);
  return snapshot;
}

export async function renameChartSnapshot(id: string, title: string) {
  const reports = await getSavedChartSnapshots();
  await persist(reports.map((report) => report.id === id ? { ...report, title: title.trim() || undefined } : report));
}

export async function deleteChartSnapshot(id: string) {
  const reports = await getSavedChartSnapshots();
  await persist(reports.filter((report) => report.id !== id));
}
