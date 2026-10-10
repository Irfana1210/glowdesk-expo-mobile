import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  fontFamily,
  radius,
  spacing,
  statusPalette,
  type StatusTone,
} from "@/theme";

import { AppText } from "./app-text";
import { type IconName } from "./button";

export type StatusBadgeProps = {
  icon: IconName;
  label: string;
  /** `small` is used inside dense rows such as inventory. */
  size?: "default" | "small";
  tone: StatusTone;
};

/** Pill showing a status as icon plus text, so colour is never the only signal. */
export const StatusBadge: FC<StatusBadgeProps> = ({
  label,
  icon,
  tone,
  size = "default",
}) => {
  const { background, text } = statusPalette[tone];
  const small = size === "small";
  return (
    <View
      accessible
      accessibilityLabel={`Status: ${label}`}
      style={[
        styles.badge,
        small && styles.small,
        { backgroundColor: background },
      ]}
    >
      <Ionicons color={text} name={icon} size={small ? 11 : 12} />
      <AppText
        maxFontSizeMultiplier={1.3}
        style={[styles.text, small && styles.smallText, { color: text }]}
      >
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  small: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  text: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  smallText: { fontSize: 11, lineHeight: 14 },
});
