import { isRunningInExpoGo } from "expo";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

/**
 * expo-notifications needs native modules that Expo Go doesn't ship (crashes on import).
 * Load it only in real (development / store) builds; null on web and in Expo Go.
 * The try/catch is the backstop: if detection is ever wrong, push is off instead of the app crashing.
 */
const inExpoGo =
  isRunningInExpoGo() ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === "expo";

if (__DEV__) {
  console.log("[push-gate]", {
    os: Platform.OS,
    isRunningInExpoGo: isRunningInExpoGo(),
    executionEnvironment: Constants.executionEnvironment,
    appOwnership: Constants.appOwnership,
  });
}

function loadNotifications(): typeof import("expo-notifications") | null {
  if (Platform.OS === "web" || inExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-notifications");
  } catch (e) {
    if (__DEV__) console.warn("[push-gate] expo-notifications unavailable, push disabled:", String(e));
    return null;
  }
}

export const Notifications = loadNotifications();
export const pushSupported = Notifications !== null;
