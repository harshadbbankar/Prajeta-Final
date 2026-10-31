import * as Linking from "expo-linking";
import { Platform } from "react-native";

import { storage } from "@/src/utils/storage";

const KEY = "pending_ref";

/** Share link that opens the app with this referral code ready. */
export const referralLink = (code: string) =>
  Platform.OS === "web" && typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${encodeURIComponent(code)}`
    : Linking.createURL("/", { queryParams: { ref: code } });

/** Save the `ref` code from an opened link so the booking screen can apply it. */
export async function captureReferral(url: string | null) {
  if (!url) return;
  const ref = Linking.parse(url).queryParams?.ref;
  const code = (Array.isArray(ref) ? ref[0] : ref)?.trim().toUpperCase();
  if (code && /^[A-Z0-9-]{3,20}$/.test(code)) await storage.setItem(KEY, code);
}

export const getPendingReferral = () => storage.getItem<string | null>(KEY, null);
export const clearPendingReferral = () => storage.removeItem(KEY);
