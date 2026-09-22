import * as SecureStore from "expo-secure-store";
const PIN_KEY = "pocket-budget-fallback-pin";
export async function savePin(pin: string) { if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN must be 4 to 6 digits"); await SecureStore.setItemAsync(PIN_KEY, pin); }
export async function hasPin() { return Boolean(await SecureStore.getItemAsync(PIN_KEY)); }
export async function verifyPin(pin: string) { const saved = await SecureStore.getItemAsync(PIN_KEY); return Boolean(saved && saved === pin); }
export async function clearPin() { await SecureStore.deleteItemAsync(PIN_KEY); }
