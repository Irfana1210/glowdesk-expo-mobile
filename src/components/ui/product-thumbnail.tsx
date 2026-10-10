import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import { colors, fontFamily, radius, swatches } from "@/theme";

import { AppText } from "./app-text";

function swatchFor(seed: string): string {
  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return swatches[hash % swatches.length] ?? colors.neutralSoft;
}

/** "LUMEN SKIN" → "LS", "PETAL & PITH" → "P&P", "KŌRI" → "K". */
export function monogram(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const letters = words
    .filter((w) => /^[A-Za-zÀ-ÿĀ-ž]/.test(w))
    .map((w) => w[0]?.toUpperCase() ?? "");
  if (words.includes("&") && letters.length >= 2) {
    return `${letters[0]}&${letters[1]}`;
  }
  return letters.slice(0, 2).join("");
}

type Props = {
  /** Brand name, turned into the monogram. */
  label: string;
  /** Stable key used to pick a tint when no swatch is given. */
  seed: string;
  size?: number;
  /** Explicit tile colour from the catalogue. */
  swatch?: string;
};

/**
 * Placeholder product image: a tinted tile with the brand monogram in the display serif.
 * Decorative, so hidden from screen readers.
 */
export const ProductThumbnail: FC<Props> = ({
  seed,
  label,
  swatch,
  size = 48,
}) => {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: swatch ?? swatchFor(seed),
        },
      ]}
    >
      <AppText
        maxFontSizeMultiplier={1.2}
        style={[styles.mono, { fontSize: size >= 64 ? 30 : 20 }]}
      >
        {monogram(label)}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  mono: { fontFamily: fontFamily.display, color: colors.text },
});
