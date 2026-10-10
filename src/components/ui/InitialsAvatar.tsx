import { StyleSheet, View } from 'react-native';

import { colors, fontFamily } from '@/theme';

import { AppText } from './AppText';

/** Decorative avatar. Hidden from screen readers because the parent label already names the person. */
export function InitialsAvatar({ initials, size = 42, color }: { initials: string; size?: number; color?: string }) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? colors.avatar }]}
    >
      <AppText style={styles.text} maxFontSizeMultiplier={1.2}>
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.text },
});
