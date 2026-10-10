/**
 * RetailOS design tokens, from docs/DESIGN_HANDOFF.md.
 * Raw values only. Screens use the semantic layers in colors.ts, typography.ts and spacing.ts.
 */

export const palette = {
  background: '#F8F5F1',
  text: '#222024',
  mutedText: '#5E5A61',
  inactiveTab: '#6E6672',
  blush: '#EBCDD3',
  secondary: '#816C83',
  secondaryText: '#6F5B71',
  success: '#4C826C',
  successDark: '#3E6E5A',
  error: '#C44D56',
  errorText: '#A8323C',
  white: '#FFFFFF',
  border: '#E6E1DC',
  divider: '#F0EBE6',
  track: '#EFEAE4',
} as const;

/** Background / text pairs for status pills. Text always meets WCAG AA on its background. */
export const statusPalette = {
  new: { background: '#F3E3E7', text: '#7E3343' },
  picking: { background: '#ECE6F0', text: '#4F3E55' },
  ready: { background: '#E1EEE7', text: '#2C5B4A' },
  inStock: { background: '#E1EEE7', text: '#2C5B4A' },
  lowStock: { background: '#F6EBDD', text: '#6E4512' },
  overdue: { background: '#F7E1E3', text: '#8E2A33' },
  outOfStock: { background: '#F7E1E3', text: '#8E2A33' },
  neutral: { background: '#EFEAE4', text: '#5E5A61' },
} as const;

export type StatusTone = keyof typeof statusPalette;

/** Colours used on the dark "your shift" card. */
export const darkSurface = {
  background: '#222024',
  text: '#FFFFFF',
  mutedText: '#D6CFD8',
  track: 'rgba(255, 255, 255, 0.18)',
  divider: 'rgba(255, 255, 255, 0.14)',
  pill: '#3E6E5A',
} as const;

/** Shift state indicators on roster rows (dot + text, never colour alone). */
export const shiftStateColors = {
  on: { dot: '#4C826C', text: '#2C5B4A' },
  warn: { dot: '#C98A2E', text: '#8A5A1F' },
  off: { dot: '#A49CA6', text: '#5E5A61' },
} as const;

/** Soft tints for avatars and product tiles. */
export const swatches = ['#F3E3E7', '#ECE6F0', '#DCE8E4', '#F2EBDD', '#EAD9CF', '#E6E1DC', '#DDE3EC'] as const;

/** Family names as registered with useFonts in the root layout. */
export const fontFamilies = {
  display: 'InstrumentSerif_400Regular',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const fontSizes = {
  eyebrow: 11,
  caption: 12,
  small: 13,
  body: 14,
  bodyLarge: 15,
  title: 16,
  stat: 20,
  kpi: 22,
  section: 18,
  orderNumber: 32,
  hero: 40,
  display: 38,
} as const;

/** Eyebrow labels above titles: uppercase with ~1.5 letter spacing. */
export const eyebrowLetterSpacing = 1.5;

export const space = [4, 8, 12, 16, 20, 24] as const;

export const radii = {
  tile: 12,
  button: 14,
  card: 18,
  hero: 22,
  pill: 999,
} as const;
