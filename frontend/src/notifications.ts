import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

/**
 * expo-notifications needs native modules that Expo Go doesn't ship (crashes on import).
 * Load it only in real (development / store) builds; null on web and in Expo Go.
 */
export const pushSupported = Platform.OS !== "web" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const Notifications: typeof import("expo-notifications") | null = pushSupported ? require("expo-notifications") : null;
