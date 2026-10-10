/**
 * Semantic colour roles mapped onto the design tokens. Screens use these names,
 * never raw hex values, so a token change restyles the whole app.
 */
import { palette, statusPalette } from './tokens';

export { palette };

export const colors = {
  background: palette.background,
  surface: palette.white,
  text: palette.text,
  /** #5E5A61 on #F8F5F1 is about 6.4:1 contrast (WCAG AA). */
  textMuted: palette.mutedText,
  textOnAccent: palette.white,
  textOnDark: palette.white,
  inactive: palette.inactiveTab,
  border: palette.border,
  divider: palette.divider,
  track: palette.track,
  accent: palette.secondary,
  accentText: palette.secondaryText,
  accentSoft: palette.blush,
  /** Selected chips, day picker and the dark shift card. */
  inverse: palette.text,
  avatar: '#F3EEF4',
  success: palette.success,
  successDark: palette.successDark,
  successSoft: statusPalette.ready.background,
  error: palette.error,
  errorText: palette.errorText,
  errorSoft: statusPalette.overdue.background,
  warningSoft: statusPalette.lowStock.background,
  warningText: statusPalette.lowStock.text,
  infoSoft: statusPalette.picking.background,
  neutralSoft: palette.track,
  disabled: '#CFC8D0',
  overlay: 'rgba(34, 32, 36, 0.4)',
} as const;

export type ColorToken = keyof typeof colors;
