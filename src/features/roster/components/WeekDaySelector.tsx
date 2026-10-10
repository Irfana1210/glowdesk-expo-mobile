import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { colors, fontFamily } from '@/theme';

import { formatDayLabel, isSameDay, toDateKey, weekdayShort } from '../domain/dates';

export interface WeekDaySelectorProps {
  days: Date[];
  selected: Date;
  today: Date;
  onSelect: (date: Date) => void;
}

/** Seven day buttons. The selected day is dark; today is announced to screen readers. */
export function WeekDaySelector({ days, selected, today, onSelect }: WeekDaySelectorProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist" accessibilityLabel="Choose a day">
      {days.map((date) => {
        const isSelected = isSameDay(date, selected);
        const isToday = isSameDay(date, today);
        const textColor = isSelected ? colors.textOnDark : colors.text;
        return (
          <Pressable
            key={toDateKey(date)}
            testID={`day-${toDateKey(date)}`}
            onPress={() => onSelect(date)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${formatDayLabel(date)}${isToday ? ', today' : ''}`}
            style={[styles.day, isSelected ? styles.selected : styles.idle]}
          >
            <AppText style={[styles.dow, { color: isSelected ? colors.textOnDark : colors.textMuted }]} maxFontSizeMultiplier={1.2}>
              {weekdayShort(date)}
            </AppText>
            <AppText style={[styles.num, { color: textColor }]} maxFontSizeMultiplier={1.2}>
              {date.getDate()}
            </AppText>
            <View style={[styles.todayDot, isToday ? { backgroundColor: textColor } : null]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, minHeight: 56, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  idle: { backgroundColor: colors.surface, borderColor: colors.border },
  selected: { backgroundColor: colors.inverse, borderColor: colors.inverse },
  dow: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 14 },
  num: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 20 },
  todayDot: { width: 4, height: 4, borderRadius: 2 },
});

