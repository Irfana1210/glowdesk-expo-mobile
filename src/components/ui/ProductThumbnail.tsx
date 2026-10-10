import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radius, swatches } from '@/theme';

import { AppText } from './AppText';

function swatchFor(seed: string): string {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return swatches[hash % swatches.length] ?? colors.neutralSoft;
}

/** "LUMEN SKIN" → "LS", "PETAL & PITH" → "P&P", "KŌRI" → "K". */
export function monogram(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const letters = words.filter((w) => /^[A-Za-zÀ-ÿĀ-ž]/.test(w)).map((w) => w[0]?.toUpperCase() ?? '');
  if (words.includes('&') && letters.length >= 2) return `${letters[0]}&${letters[1]}`;
  return letters.slice(0, 2).join('');
}

export interface ProductThumbnailProps {
  /** Stable key used to pick a tint when no swatch is given. */
  seed: string;
  /** Brand name, turned into the monogram. */
  label: string;
  /** Explicit tile colour from the catalogue. */
  swatch?: string;
  size?: number;
}

/**
 * Placeholder product image: a tinted tile with the brand monogram in the display serif.
 * Decorative, so hidden from screen readers.
 */
export function ProductThumbnail({ seed, label, swatch, size = 48 }: ProductThumbnailProps) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.tile, { width: size, height: size, backgroundColor: swatch ?? swatchFor(seed) }]}
    >
      <AppText style={[styles.mono, { fontSize: size >= 64 ? 30 : 20 }]} maxFontSizeMultiplier={1.2}>
        {monogram(label)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  mono: { fontFamily: fontFamily.display, color: colors.text },
});
