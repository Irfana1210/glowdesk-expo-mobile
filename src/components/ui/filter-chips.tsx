import { Pressable, ScrollView, StyleSheet } from "react-native";

import { LOCALE } from "@/constants/locale";

import { colors, fontFamily, radius, spacing } from "@/theme";

import { AppText } from "./app-text";

const L = LOCALE.components.filterChips;

export type FilterOption<T extends string> = {
  count?: number;
  label: string;
  value: T;
};

export type FilterChipsProps<T extends string> = {
  accessibilityLabel: string;
  onChange: (value: T) => void;
  options: ReadonlyArray<FilterOption<T>>;
  selected: T;
};

/** Horizontal chips. The selected chip is dark; selection is also exposed to screen readers. */
export function FilterChips<T extends string>({
  options,
  selected,
  onChange,
  accessibilityLabel,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      contentContainerStyle={styles.row}
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        const textColor = isSelected ? colors.textOnDark : colors.text;
        return (
          <Pressable
            accessibilityLabel={
              option.count === undefined
                ? option.label
                : L.optionWithCount(option.label, option.count)
            }
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            hitSlop={{ top: 4, bottom: 4 }}
            key={option.value}
            style={[
              styles.chip,
              isSelected ? styles.chipSelected : styles.chipIdle,
            ]}
            testID={`filter-${option.value}`}
            onPress={() => onChange(option.value)}
          >
            <AppText
              maxFontSizeMultiplier={1.3}
              style={[styles.label, { color: textColor }]}
            >
              {option.label}
              {option.count === undefined ? null : (
                <AppText
                  style={[styles.count, { color: textColor }]}
                >{` ${option.count}`}</AppText>
              )}
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
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipIdle: { backgroundColor: colors.surface, borderColor: colors.border },
  chipSelected: {
    backgroundColor: colors.inverse,
    borderColor: colors.inverse,
  },
  label: { fontFamily: fontFamily.semibold, fontSize: 13, lineHeight: 18 },
  count: { fontFamily: fontFamily.medium, fontSize: 13, opacity: 0.75 },
});
