import { type FC } from "react";
import { Text, type TextProps } from "react-native";

import {
  colors,
  type ColorToken,
  maxFontScale,
  typography,
  type TypographyVariant,
} from "@/theme";

type AppTextProps = {
  color?: ColorToken;
  variant?: TypographyVariant;
} & TextProps;

/** Text with the Glowdesk type scale. Respects the OS font size, capped so dense layouts stay usable. */
export const AppText: FC<AppTextProps> = ({
  variant = "body",
  color = "text",
  style,
  maxFontSizeMultiplier = maxFontScale,
  ...rest
}) => {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
};
