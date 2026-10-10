import { type FC } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { LOCALE } from "@/constants/locale";

import {
  colors,
  fontFamily,
  maxFontScale,
  radius,
  spacing,
  touchTarget,
} from "@/theme";

const L = LOCALE.components.searchBar;

type Props = {
  accessibilityLabel: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID?: string;
  value: string;
};

export const SearchBar: FC<Props> = ({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  testID,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons color={colors.textMuted} name="search" size={18} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        maxFontSizeMultiplier={maxFontScale}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel={L.clear}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.clear}
          onPress={() => onChangeText("")}
        >
          <Ionicons color={colors.textMuted} name="close-circle" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  clear: { padding: spacing.xs },
});
