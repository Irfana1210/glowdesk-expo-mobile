import { type FC, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { AppText } from "@/components/ui/app-text";

import { colors, spacing, touchTarget } from "@/theme";

type Props = {
  /** Shows a back button. Uses a compact centred title, as on a detail screen. */
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
  title: string;
};

export const AppHeader: FC<Props> = ({ title, subtitle, onBack, right }) => {
  if (onBack) {
    return (
      <View style={styles.compact}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={4}
          style={styles.iconButton}
          onPress={onBack}
        >
          <Ionicons color={colors.text} name="arrow-back" size={24} />
        </Pressable>
        <AppText
          accessibilityRole="header"
          numberOfLines={1}
          style={styles.compactTitle}
          variant="cardTitle"
        >
          {title}
        </AppText>
        <View style={styles.iconButton}>{right}</View>
      </View>
    );
  }

  return (
    <View style={styles.large}>
      <View style={styles.titles}>
        <AppText accessibilityRole="header" variant="pageTitle">
          {title}
        </AppText>
        {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  large: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  titles: { flex: 1, gap: spacing.xs },
  compact: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  compactTitle: { flex: 1, textAlign: "center" },
  iconButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
