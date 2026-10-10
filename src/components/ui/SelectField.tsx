import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, touchTarget } from '@/theme';

import { AppText } from './AppText';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

export interface SelectFieldProps<T extends string | number> {
  label: string;
  value: T | undefined;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
  testID?: string;
}

const ITEM_HEIGHT = 56;

/** A labelled field that opens a bottom sheet of options. Works the same on iOS and Android. */
export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  error,
  testID,
}: SelectFieldProps<T>) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        testID={testID}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected?.label ?? 'not selected'}`}
        accessibilityHint={error ?? 'Opens a list of options'}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <AppText color={selected ? 'text' : 'textMuted'} style={styles.flex}>
          {selected?.label ?? placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <AppText variant="supporting" color="error" testID={testID ? `${testID}-error` : undefined}>
          {error}
        </AppText>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.flex} onPress={() => setOpen(false)} accessibilityLabel="Close" accessibilityRole="button" />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <AppText variant="cardTitle" accessibilityRole="header">
                {label}
              </AppText>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
              // Option lists are short (at most 96 quarter hours), so every row renders up front and
              // the list opens scrolled to the current choice without skipping earlier rows.
              initialNumToRender={Math.min(options.length, 100)}
              contentOffset={{ x: 0, y: Math.max(0, selectedIndex - 2) * ITEM_HEIGHT }}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    testID={testID ? `${testID}-option-${item.value}` : undefined}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={item.description ? `${item.label}, ${item.description}` : item.label}
                    style={[styles.option, isSelected && styles.optionSelected]}
                  >
                    <View style={styles.flex}>
                      <AppText variant={isSelected ? 'bodyStrong' : 'body'}>{item.label}</AppText>
                      {item.description ? (
                        <AppText variant="supporting" color="textMuted">
                          {item.description}
                        </AppText>
                      ) : null}
                    </View>
                    {isSelected ? <Ionicons name="checkmark" size={20} color={colors.accent} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  flex: { flex: 1 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldError: { borderColor: colors.error },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  close: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  option: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.infoSoft },
});
