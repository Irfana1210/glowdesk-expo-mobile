import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, InitialsAvatar } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

import { formatDayLabel } from '../domain/dates';
import { formatHours, formatShiftTimes, isOvernight, paidMinutes } from '../domain/shifts';
import { ROLE_LABELS, type Employee } from '@/features/employees/types';

import type { Shift } from '../types';

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export interface ShiftCardProps {
  shift: Shift;
  employee: Employee | undefined;
  onPress: (shiftId: string) => void;
}

function ShiftCardComponent({ shift, employee, onPress }: ShiftCardProps) {
  const name = employee?.name ?? 'Unknown employee';
  const role = employee ? ROLE_LABELS[employee.role] : '';
  const times = formatShiftTimes(shift);
  const paid = formatHours(paidMinutes(shift));
  const overnight = isOvernight(shift);
  const breakText = shift.unpaidBreakMinutes > 0 ? `${shift.unpaidBreakMinutes}m break` : 'no break';

  return (
    <Pressable
      testID={`shift-card-${shift.id}`}
      onPress={() => onPress(shift.id)}
      accessibilityRole="button"
      accessibilityLabel={[
        name,
        role,
        times,
        overnight ? `overnight, ends ${formatDayLabel(new Date(shift.endAt))}` : null,
        `${paid} paid`,
        breakText,
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Opens the shift editor"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <InitialsAvatar initials={initialsOf(name)} size={40} />
      <View style={styles.person}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="supporting" color="textMuted" numberOfLines={1}>
          {role}
        </AppText>
      </View>
      <View style={styles.times}>
        <AppText variant="bodyStrong">{times}</AppText>
        <AppText variant="supporting" color="textMuted">
          {paid} paid · {breakText}
        </AppText>
        {overnight ? (
          <View style={styles.overnight}>
            <Ionicons name="moon-outline" size={12} color={colors.accent} />
            <AppText variant="label">Overnight</AppText>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export const ShiftCard = memo(ShiftCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  person: { flex: 1, gap: 2 },
  times: { alignItems: 'flex-end', gap: 2 },
  overnight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
