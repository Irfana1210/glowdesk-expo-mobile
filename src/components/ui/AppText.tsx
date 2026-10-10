import { Text, type TextProps } from 'react-native';

import { colors, maxFontScale, typography, type ColorToken, type TypographyVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
}

/** Text with the RetailOS type scale. Respects the OS font size, capped so dense layouts stay usable. */
export function AppText({
  variant = 'body',
  color = 'text',
  style,
  maxFontSizeMultiplier = maxFontScale,
  ...rest
}: AppTextProps) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}
