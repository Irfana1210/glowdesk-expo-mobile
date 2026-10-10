import { forwardRef, useState } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import {
  colors,
  fontFamily,
  maxFontScale,
  radius,
  spacing,
  touchTarget,
} from "@/theme";

import { AppText } from "./app-text";

export type TextFieldProps = {
  error?: string | null;
  hint?: string;
  label: string;
} & Omit<TextInputProps, "style">;

/** Labelled input. The label and any error are exposed to screen readers with the field. */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, error, hint, onFocus, onBlur, ...rest }, ref) {
    const [focused, setFocused] = useState(false);
    const description = error ?? hint;

    return (
      <View style={styles.container}>
        <AppText variant="label">{label}</AppText>
        <TextInput
          accessibilityHint={description ?? undefined}
          accessibilityLabel={label}
          maxFontSizeMultiplier={maxFontScale}
          placeholderTextColor={colors.textMuted}
          ref={ref}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error ? styles.inputError : null,
          ]}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          {...rest}
        />
        {description ? (
          <AppText
            accessibilityLiveRegion="polite"
            color={error ? "error" : "textMuted"}
            variant="supporting"
          >
            {description}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  input: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fontFamily.regular,
    fontSize: 16,
  },
  inputFocused: { borderColor: colors.accent },
  inputError: { borderColor: colors.error },
});
