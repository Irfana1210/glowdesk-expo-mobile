import { type FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  colors,
  fontFamily,
  radius,
  spacing,
  statusPalette,
  type StatusTone,
} from "@/theme";

import { AppText } from "./app-text";
import { type IconName } from "./button";

type AttentionItemProps = {
  accessibilityHint?: string;
  icon: IconName;
  onPress: () => void;
  subtitle: string;
  testID?: string;
  title: string;
  /** Tints the icon tile. The title text carries the meaning, not the colour. */
  tone: StatusTone;
};

/** One row in the dashboard's "Needs attention" list. */
export const AttentionItem: FC<AttentionItemProps> = ({
  title,
  subtitle,
  icon,
  tone,
  onPress,
  accessibilityHint,
  testID,
}) => {
  const palette = statusPalette[tone];
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      testID={testID}
      onPress={onPress}
    >
      <View style={[styles.icon, { backgroundColor: palette.background }]}>
        <Ionicons color={palette.text} name={icon} size={20} />
      </View>
      <View style={styles.body}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText color="textMuted" variant="supporting">
          {subtitle}
        </AppText>
      </View>
      <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.md,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
});
