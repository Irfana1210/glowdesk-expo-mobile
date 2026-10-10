import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { InitialsAvatar } from './InitialsAvatar';
import { StatusBadge, type StatusBadgeProps } from './StatusBadge';

export interface OrderCardProps {
  /** Order ID without the prefix, e.g. "7841". Shown as "#ORD-7841". */
  orderNumber: string;
  initials: string;
  /** "5 items · placed 1:47 pm" */
  summary: string;
  status: StatusBadgeProps;
  /** "Jordan Lee", "Unassigned" or "Packed by Aisha Rahman". */
  assigneeLabel: string;
  /** "Overdue 53 min", "Due 4:44 pm" or "Waiting 3h". */
  timingLabel: string;
  overdue?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}

/** One Click & Collect order in a list. Presentational: all text is prepared by the caller. */
function OrderCardComponent({
  orderNumber,
  initials,
  summary,
  status,
  assigneeLabel,
  timingLabel,
  overdue = false,
  onPress,
  accessibilityLabel,
  testID,
}: OrderCardProps) {
  const timingColor = overdue ? colors.errorText : colors.textMuted;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens order details"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <InitialsAvatar initials={initials} />
        <View style={styles.body}>
          <AppText style={styles.number}>#ORD-{orderNumber}</AppText>
          <AppText variant="supporting" color="textMuted">
            {summary}
          </AppText>
        </View>
        <StatusBadge {...status} />
      </View>
      <View style={styles.footer}>
        <View style={styles.meta}>
          <Ionicons name="person-outline" size={14} color={colors.textMuted} />
          <AppText variant="supporting" color="textMuted" numberOfLines={1} style={styles.flexShrink}>
            {assigneeLabel}
          </AppText>
        </View>
        <View style={styles.meta}>
          <Ionicons name={overdue ? 'alert-circle-outline' : 'time-outline'} size={13} color={timingColor} />
          <AppText style={[styles.timing, { color: timingColor }]}>{timingLabel}</AppText>
        </View>
      </View>
    </Pressable>
  );
}

export const OrderCard = memo(OrderCardComponent);

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: 2 },
  number: { fontFamily: fontFamily.semibold, fontSize: 15, lineHeight: 20, color: colors.text },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  flexShrink: { flexShrink: 1 },
  timing: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16 },
});
