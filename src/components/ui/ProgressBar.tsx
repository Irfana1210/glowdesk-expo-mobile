import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

import { AppText } from "./AppText";

type Props = {
  accessibilityLabel?: string;
  label: string;
  /** 0 to 1. Values outside the range are clamped. */
  ratio: number;
};

export const ProgressBar: FC<Props> = ({
  ratio,
  label,
  accessibilityLabel,
}) => {
  const clamped = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
  const percent = Math.round(clamped * 100);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.container}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.labels}>
        <AppText color="textMuted" variant="supporting">
          {label}
        </AppText>
        <AppText variant="label">{percent}%</AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.success,
  },
  labels: { flexDirection: "row", justifyContent: "space-between" },
});
