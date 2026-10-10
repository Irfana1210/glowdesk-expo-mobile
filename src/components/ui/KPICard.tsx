import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontFamily, fontSizes, spacing } from '@/theme';

import { AppText } from './AppText';
import type { IconName } from './Button';

export interface KPICardProps {
  label: string;
  value: string;
  supporting?: string;
  /** Optional. The dashboard tiles in the design have no icon. */
  icon?: IconName;
  /** Spoken instead of the visible text, for example to expand "—" into "not available". */
  accessibilityLabel?: string;
  onPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Small white tile: label, large value, supporting line. */
export function KPICard({
  label,
  value,
  supporting,
  icon,
  accessibilityLabel,
  onPress,
  accessibilityHint,
  style,
  testID,
}: KPICardProps) {
  const spoken = accessibilityLabel ?? [label, value, supporting].filter(Boolean).join(', ');
  const content = (
    <>
      <View style={styles.top}>
        <AppText variant="supporting" color="textMuted" style={styles.label}>
          {label}
        </AppText>
        {icon ? <Ionicons name={icon} size={16} color={colors.accent} /> : null}
      </View>
      <AppText style={styles.value} testID={testID ? `${testID}-value` : undefined}>
        {value}
      </AppText>
      {supporting ? (
        <AppText variant="supporting" color="textMuted">
          {supporting}
        </AppText>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} accessible accessibilityLabel={spoken} style={[styles.card, style]}>
      {content}
    </View>
  );
}

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
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  label: { flex: 1 },
  value: { fontFamily: fontFamily.semibold, fontSize: fontSizes.kpi, lineHeight: 28, color: colors.text },
});

