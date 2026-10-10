import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontFamily, maxFontScale, radius, spacing, touchTarget } from '@/theme';

import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  hint?: string;
}

/** Labelled input. The label and any error are exposed to screen readers with the field. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const description = error ?? hint;

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={description ?? undefined}
        placeholderTextColor={colors.textMuted}
        maxFontSizeMultiplier={maxFontScale}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, focused && styles.inputFocused, error ? styles.inputError : null]}
        {...rest}
      />
      {description ? (
        <AppText variant="supporting" color={error ? 'error' : 'textMuted'} accessibilityLiveRegion="polite">
          {description}
        </AppText>
      ) : null}
    </View>
  );
});

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
