import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { fontFamily, radius, spacing, statusPalette, type StatusTone } from '@/theme';

import { AppText } from './AppText';
import type { IconName } from './Button';

export interface StatusBadgeProps {
  label: string;
  icon: IconName;
  tone: StatusTone;
  /** `small` is used inside dense rows such as inventory. */
  size?: 'default' | 'small';
}

/** Pill showing a status as icon plus text, so colour is never the only signal. */
export function StatusBadge({ label, icon, tone, size = 'default' }: StatusBadgeProps) {
  const { background, text } = statusPalette[tone];
  const small = size === 'small';
  return (
    <View
      style={[styles.badge, small && styles.small, { backgroundColor: background }]}
      accessible
      accessibilityLabel={`Status: ${label}`}
    >
      <Ionicons name={icon} size={small ? 11 : 12} color={text} />
      <AppText style={[styles.text, small && styles.smallText, { color: text }]} maxFontSizeMultiplier={1.3}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  small: { paddingHorizontal: spacing.sm, paddingVertical: 3 },
  text: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
  smallText: { fontSize: 11, lineHeight: 14 },
});
