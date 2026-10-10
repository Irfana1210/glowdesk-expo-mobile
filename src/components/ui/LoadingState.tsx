import { type FC, useEffect } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import { colors, spacing } from "@/theme";

import { AppText } from "./AppText";

export const LoadingState: FC<{ message?: string }> = ({
  message = "Loading…",
}) => {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.container}
      testID="loading-state"
    >
      <ActivityIndicator color={colors.accent} size="large" />
      <AppText color="textMuted">{message}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
});
