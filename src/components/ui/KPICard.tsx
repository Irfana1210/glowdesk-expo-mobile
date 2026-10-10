import { type FC } from "react";
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, fontFamily, fontSizes, spacing } from "@/theme";

import { AppText } from "./AppText";
import { type IconName } from "./Button";

type Props = {
  accessibilityHint?: string;
  /** Spoken instead of the visible text, for example to expand "—" into "not available". */
  accessibilityLabel?: string;
  /** Optional. The dashboard tiles in the design have no icon. */
  icon?: IconName;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  supporting?: string;
  testID?: string;
  value: string;
};

/** Small white tile: label, large value, supporting line. */
export const KPICard: FC<Props> = ({
  label,
  value,
  supporting,
  icon,
  accessibilityLabel,
  onPress,
  accessibilityHint,
  style,
  testID,
}) => {
  const spoken =
    accessibilityLabel ?? [label, value, supporting].filter(Boolean).join(", ");
  const content = (
    <>
      <View style={styles.top}>
        <AppText color="textMuted" style={styles.label} variant="supporting">
          {label}
        </AppText>
        {icon ? <Ionicons color={colors.accent} name={icon} size={16} /> : null}
      </View>
      <AppText
        style={styles.value}
        testID={testID ? `${testID}-value` : undefined}
      >
        {value}
      </AppText>
      {supporting ? (
        <AppText color="textMuted" variant="supporting">
          {supporting}
        </AppText>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={spoken}
        accessibilityRole="button"
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        testID={testID}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={[styles.card, style]}
      testID={testID}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: { flex: 1 },
  value: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.kpi,
    lineHeight: 28,
    color: colors.text,
  },
});
