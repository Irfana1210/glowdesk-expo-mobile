import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSizes, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface BaseButtonProps extends ButtonProps {
  variant: 'primary' | 'secondary';
}

/**
 * Shared implementation behind PrimaryButton and SecondaryButton.
 * Primary: dark, 52 high. Secondary: white with a border, 48 high. Both use a 14 radius.
 */
export function BaseButton({
  variant,
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  accessibilityHint,
  style,
  testID,
}: BaseButtonProps) {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  const foreground = inactive ? colors.inactive : isPrimary ? colors.textOnDark : colors.text;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={foreground} />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={foreground} />
        ) : null}
        <AppText style={[styles.label, { color: foreground }, isPrimary && styles.primaryLabel]}>{label}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: { minHeight: 52, backgroundColor: colors.inverse },
  secondary: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inactive: { backgroundColor: colors.track, borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fontFamily.semibold, fontSize: fontSizes.body, lineHeight: 20 },
  primaryLabel: { fontSize: fontSizes.bodyLarge },
});
