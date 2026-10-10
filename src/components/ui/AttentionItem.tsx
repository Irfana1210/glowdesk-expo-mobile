import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontFamily, radius, spacing, statusPalette, type StatusTone } from '@/theme';

import { AppText } from './AppText';
import type { IconName } from './Button';

export interface AttentionItemProps {
  title: string;
  subtitle: string;
  icon: IconName;
  /** Tints the icon tile. The title text carries the meaning, not the colour. */
  tone: StatusTone;
  onPress: () => void;
  accessibilityHint?: string;
  testID?: string;
}

/** One row in the dashboard's "Needs attention" list. */
export function AttentionItem({ title, subtitle, icon, tone, onPress, accessibilityHint, testID }: AttentionItemProps) {
  const palette = statusPalette[tone];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: palette.background }]}>
        <Ionicons name={icon} size={20} color={palette.text} />
      </View>
      <View style={styles.body}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText variant="supporting" color="textMuted">
          {subtitle}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
  icon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 19, color: colors.text },
});
