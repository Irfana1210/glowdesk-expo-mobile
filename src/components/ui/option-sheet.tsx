import { type FC } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";

import { LOCALE } from "@/constants/locale";

import { colors, radius, spacing, touchTarget } from "@/theme";

import { AppText } from "./app-text";

const L = LOCALE.components.optionSheet;

export type SheetOption = {
  description?: string;
  label: string;
  value: string;
};

type Props = {
  onClose: () => void;
  onSelect: (value: string) => void;
  options: ReadonlyArray<SheetOption>;
  selected?: string;
  testID?: string;
  title: string;
  visible: boolean;
};

/** Bottom sheet with a list of choices, for actions like reassigning an order. */
export const OptionSheet: FC<Props> = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  testID,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel={L.close}
          accessibilityRole="button"
          style={styles.flex}
          onPress={onClose}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          testID={testID}
        >
          <View style={styles.header}>
            <AppText accessibilityRole="header" variant="cardTitle">
              {title}
            </AppText>
            <Pressable
              accessibilityLabel={L.close}
              accessibilityRole="button"
              style={styles.close}
              onPress={onClose}
            >
              <Ionicons color={colors.text} name="close" size={22} />
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const isSelected = item.value === selected;
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
                  testID={testID ? `${testID}-option-${item.value}` : undefined}
                  onPress={() => onSelect(item.value)}
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
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    maxHeight: "70%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  close: {
    width: touchTarget,
    height: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  option: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  optionSelected: { backgroundColor: colors.infoSoft },
});
