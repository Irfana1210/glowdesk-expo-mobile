import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

type Props = {
  message: string;
  testID?: string;
  tone: "error" | "success" | "info";
};

const TONES = {
  error: {
    background: colors.errorSoft,
    icon: "alert-circle" as const,
    iconColor: colors.error,
  },
  success: {
    background: colors.successSoft,
    icon: "checkmark-circle" as const,
    iconColor: colors.success,
  },
  info: {
    background: colors.infoSoft,
    icon: "information-circle" as const,
    iconColor: colors.accent,
  },
};

/** Inline message. Errors use the alert role so screen readers announce them immediately. */
export const InlineBanner: FC<Props> = ({ tone, message, testID }) => {
  const t = TONES[tone];
  return (
    <View
      accessible
      accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
      accessibilityRole={tone === "error" ? "alert" : "text"}
      style={[styles.banner, { backgroundColor: t.background }]}
      testID={testID}
    >
      <Ionicons color={t.iconColor} name={t.icon} size={18} />
      <AppText style={styles.text}>{message}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  text: { flex: 1 },
});
