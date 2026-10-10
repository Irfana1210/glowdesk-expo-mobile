import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';
import type { IconName } from './Button';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  action?: ReactNode;
  testID?: string;
}

export function EmptyState({ title, message, icon = 'file-tray-outline', action, testID = 'empty-state' }: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.iconCircle} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <AppText variant="sectionTitle" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      {message ? (
        <AppText color="textMuted" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center' },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
