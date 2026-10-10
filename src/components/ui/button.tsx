import { type ComponentProps, type FC } from "react";
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, fontFamily, fontSizes, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type ButtonProps = {
  accessibilityHint?: string;
  disabled?: boolean;
  icon?: IconName;
  label: string;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type Props = {
  variant: "primary" | "secondary";
} & ButtonProps;

/**
 * Shared implementation behind PrimaryButton and SecondaryButton.
 * Primary: dark, 52 high. Secondary: white with a border, 48 high. Both use a 14 radius.
 */
export const BaseButton: FC<Props> = ({
  variant,
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  accessibilityHint,
  style,
  testID,
}) => {
  const isPrimary = variant === "primary";
  const inactive = disabled || loading;
  const foreground = inactive
    ? colors.inactive
    : isPrimary
      ? colors.textOnDark
      : colors.text;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
      testID={testID}
      onPress={onPress}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={foreground} />
        ) : icon ? (
          <Ionicons color={foreground} name={icon} size={18} />
        ) : null}
        <AppText
          style={[
            styles.label,
            { color: foreground },
            isPrimary && styles.primaryLabel,
          ]}
        >
          {label}
        </AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  primary: { minHeight: 52, backgroundColor: colors.inverse },
  secondary: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactive: {
    backgroundColor: colors.track,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSizes.body,
    lineHeight: 20,
  },
  primaryLabel: { fontSize: fontSizes.bodyLarge },
});
