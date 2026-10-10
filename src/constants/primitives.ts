import { Platform } from "react-native";

export const MS_IN_SECOND = 1000;
export const MS_IN_MINUTE = MS_IN_SECOND * 60;

/** Delay the mock services add so loading states are real until Supabase lands. */
export const MOCK_LATENCY_MS = 500;

export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
