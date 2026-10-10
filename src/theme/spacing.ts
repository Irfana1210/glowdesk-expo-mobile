import { radii, space } from "./tokens";

/** Spacing scale from the design handoff: 4, 8, 12, 16, 20, 24. */
export const spacing = {
  xs: space[0],
  sm: space[1],
  md: space[2],
  lg: space[3],
  /** Page gutter in the mockups. */
  xl: space[4],
  xxl: space[5],
} as const;

export const radius = {
  /** Tiles and thumbnails. */
  sm: radii.tile,
  /** Buttons, inputs and banners. */
  md: radii.button,
  /** Cards. */
  lg: radii.card,
  /** Hero cards. */
  xl: radii.hero,
  pill: radii.pill,
} as const;

/** Minimum touch target (Apple HIG 44pt, Material 48dp). */
export const touchTarget = 48;

/** Caps text scaling on dense layouts so large accessibility sizes still fit. */
export const maxFontScale = 1.6;
