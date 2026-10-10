import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";

import { colors, radius, spacing, touchTarget } from "@/theme";

import { AppText } from "./app-text";

export type SelectOption<T extends string | number> = {
  description?: string;
  label: string;
  value: T;
};

export type SelectFieldProps<T extends string | number> = {
  error?: string;
  label: string;
  onChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  placeholder?: string;
  testID?: string;
  value: T | undefined;
};

const ITEM_HEIGHT = 56;

/** A labelled field that opens a bottom sheet of options. Works the same on iOS and Android. */
export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
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
        accessibilityHint={error ?? "Opens a list of options"}
        accessibilityLabel={`${label}, ${selected?.label ?? "not selected"}`}
        accessibilityRole="button"
        style={[styles.field, error ? styles.fieldError : null]}
        testID={testID}
        onPress={() => setOpen(true)}
      >
        <AppText color={selected ? "text" : "textMuted"} style={styles.flex}>
          {selected?.label ?? placeholder}
        </AppText>
        <Ionicons color={colors.textMuted} name="chevron-down" size={18} />
      </Pressable>
      {error ? (
        <AppText
          color="error"
          testID={testID ? `${testID}-error` : undefined}
          variant="supporting"
        >
          {error}
        </AppText>
      ) : null}

      <Modal
        transparent
        animationType="slide"
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            style={styles.flex}
            onPress={() => setOpen(false)}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
            ]}
          >
            <View style={styles.sheetHeader}>
              <AppText accessibilityRole="header" variant="cardTitle">
                {label}
              </AppText>
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                style={styles.close}
                onPress={() => setOpen(false)}
              >
                <Ionicons color={colors.text} name="close" size={22} />
              </Pressable>
            </View>
            <FlatList
              contentOffset={{
                x: 0,
                y: Math.max(0, selectedIndex - 2) * ITEM_HEIGHT,
              }}
              data={options}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              // Option lists are short (at most 96 quarter hours), so every row renders up front and
              // the list opens scrolled to the current choice without skipping earlier rows.
              initialNumToRender={Math.min(options.length, 100)}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    accessibilityLabel={
                      item.description
                        ? `${item.label}, ${item.description}`
                        : item.label
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    testID={
                      testID ? `${testID}-option-${item.value}` : undefined
                    }
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <View style={styles.flex}>
                      <AppText variant={isSelected ? "bodyStrong" : "body"}>
                        {item.label}
                      </AppText>
                      {item.description ? (
                        <AppText color="textMuted" variant="supporting">
                          {item.description}
                        </AppText>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons
                        color={colors.accent}
                        name="checkmark"
                        size={20}
                      />
                    ) : null}
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
    flexDirection: "row",
    alignItems: "center",
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
    maxHeight: "70%",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  close: {
    width: touchTarget,
    height: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  option: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.infoSoft },
});
