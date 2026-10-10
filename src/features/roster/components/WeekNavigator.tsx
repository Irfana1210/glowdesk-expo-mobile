import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, spacing, touchTarget } from '@/theme';

import { addDays, formatWeekRange, isSameDay, startOfWeek } from '../domain/dates';

export interface WeekNavigatorProps {
  weekStart: Date;
  now: Date;
  onChange: (weekStart: Date) => void;
}

export function WeekNavigator({ weekStart, now, onChange }: WeekNavigatorProps) {
  const isCurrentWeek = isSameDay(weekStart, startOfWeek(now));
  return (
    <View style={styles.row}>
      <Pressable
        testID="previous-week"
        onPress={() => onChange(addDays(weekStart, -7))}
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        style={styles.button}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <View style={styles.label}>
        <AppText variant="cardTitle" testID="week-range" accessibilityRole="header">
          {formatWeekRange(weekStart)}
        </AppText>
        {!isCurrentWeek ? (
          <Pressable onPress={() => onChange(startOfWeek(now))} accessibilityRole="button" hitSlop={8}>
            <AppText variant="label" color="accent">
              Back to this week
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        testID="next-week"
        onPress={() => onChange(addDays(weekStart, 7))}
        accessibilityRole="button"
        accessibilityLabel="Next week"
        style={styles.button}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
  button: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, alignItems: 'center', gap: 2 },
});
