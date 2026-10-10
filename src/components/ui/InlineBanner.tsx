import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export interface InlineBannerProps {
  tone: 'error' | 'success' | 'info';
  message: string;
  testID?: string;
}

const TONES = {
  error: { background: colors.errorSoft, icon: 'alert-circle' as const, iconColor: colors.error },
  success: { background: colors.successSoft, icon: 'checkmark-circle' as const, iconColor: colors.success },
  info: { background: colors.infoSoft, icon: 'information-circle' as const, iconColor: colors.accent },
};

/** Inline message. Errors use the alert role so screen readers announce them immediately. */
export function InlineBanner({ tone, message, testID }: InlineBannerProps) {
  const t = TONES[tone];
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      style={[styles.banner, { backgroundColor: t.background }]}
    >
      <Ionicons name={t.icon} size={18} color={t.iconColor} />
      <AppText style={styles.text}>{message}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  text: { flex: 1 },
});
