import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { colors, fontFamily, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterChipsProps<T extends string> {
  options: readonly FilterOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Horizontal chips. The selected chip is dark; selection is also exposed to screen readers. */
export function FilterChips<T extends string>({ options, selected, onChange, accessibilityLabel }: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        const textColor = isSelected ? colors.textOnDark : colors.text;
        return (
          <Pressable
            key={option.value}
            testID={`filter-${option.value}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={
              option.count === undefined ? option.label : `${option.label}, ${option.count} orders`
            }
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, isSelected ? styles.chipSelected : styles.chipIdle]}
          >
            <AppText style={[styles.label, { color: textColor }]} maxFontSizeMultiplier={1.3}>
              {option.label}
              {option.count === undefined ? null : <AppText style={[styles.count, { color: textColor }]}>{` ${option.count}`}</AppText>}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipIdle: { backgroundColor: colors.surface, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.inverse, borderColor: colors.inverse },
  label: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18 },
  count: { fontFamily: fontFamily.medium, fontSize: 13, opacity: 0.75 },
});
