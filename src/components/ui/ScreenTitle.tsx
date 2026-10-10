import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';

export interface ScreenTitleProps {
  /** Small uppercase label above the title, e.g. "Click & Collect". */
  eyebrow: string;
  title: string;
  /** Optional line under the title, e.g. the user's role. */
  subtitle?: string;
  /** Header actions on the right, e.g. IconButtons. */
  right?: ReactNode;
}

/** Tab screen header: eyebrow plus large serif title. */
export function ScreenTitle({ eyebrow, title, subtitle, right }: ScreenTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <AppText variant="eyebrow" color="textMuted">
          {eyebrow}
        </AppText>
        <AppText variant="display" accessibilityRole="header" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? <AppText color="textMuted">{subtitle}</AppText> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  titles: { flex: 1, gap: spacing.xs },
  right: { flexDirection: 'row', gap: spacing.sm },
});
