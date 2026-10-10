import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, spacing, touchTarget } from '@/theme';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back button. Uses a compact centred title, as on a detail screen. */
  onBack?: () => void;
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, onBack, right }: AppHeaderProps) {
  if (onBack) {
    return (
      <View style={styles.compact}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.iconButton}
          hitSlop={4}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="cardTitle" accessibilityRole="header" style={styles.compactTitle} numberOfLines={1}>
          {title}
        </AppText>
        <View style={styles.iconButton}>{right}</View>
      </View>
    );
  }

  return (
    <View style={styles.large}>
      <View style={styles.titles}>
        <AppText variant="pageTitle" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  large: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  titles: { flex: 1, gap: spacing.xs },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  compactTitle: { flex: 1, textAlign: 'center' },
  iconButton: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
