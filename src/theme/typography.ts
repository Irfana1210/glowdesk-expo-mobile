import { type TextStyle } from "react-native";

import {
  displayLetterSpacing,
  eyebrowLetterSpacing,
  fontFamilies,
  fonts,
  fontSizes,
} from "./tokens";

/** Font family names registered in the root layout via `useFonts`. */
export const fontFamily = fontFamilies;

/**
 * Type scale. DM Serif Display for display text, DM Sans for everything else. Custom fonts on
 * Android ignore `fontWeight`, so each variant sets the weight-specific family instead.
 */
export const typography = {
  /** Page titles (38). Serif line heights are generous so descenders never clip. */
  display: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    letterSpacing: displayLetterSpacing,
    lineHeight: 44,
  },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    letterSpacing: displayLetterSpacing,
    lineHeight: 44,
  },
  /** Hero numbers such as today's sales (36–44). */
  hero: {
    fontFamily: fonts.display,
    fontSize: fontSizes.hero,
    letterSpacing: displayLetterSpacing,
    lineHeight: 46,
  },
  orderNumber: {
    fontFamily: fonts.display,
    fontSize: fontSizes.orderNumber,
    letterSpacing: displayLetterSpacing,
    lineHeight: 38,
  },
  eyebrow: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.eyebrow,
    lineHeight: 14,
    letterSpacing: eyebrowLetterSpacing,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.section,
    lineHeight: 26,
  },
  cardTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.title,
    lineHeight: 22,
  },
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.bodyLarge,
    lineHeight: 21,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.body,
    lineHeight: 20,
  },
  bodyStrong: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.body,
    lineHeight: 20,
  },
  supporting: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.caption,
    lineHeight: 16,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.caption,
    lineHeight: 16,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
