import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontFamily, radius } from '@/theme';

import { AppText } from './AppText';
import type { IconName } from './Button';

export interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  /** `outline` is white with a border; `filled` is dark. */
  variant?: 'outline' | 'filled';
  /** Small count bubble, for example unread notifications. */
  badge?: number;
  /** Text shown instead of an icon, for example profile initials. */
  text?: string;
  testID?: string;
}

/** Round 44×44 button used in screen headers. */
export function IconButton({ icon, accessibilityLabel, onPress, variant = 'outline', badge, text, testID }: IconButtonProps) {
  const filled = variant === 'filled';
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.button, filled ? styles.filled : styles.outline, pressed && styles.pressed]}
    >
      {text ? (
        <AppText style={[styles.text, filled && styles.textFilled]} maxFontSizeMultiplier={1.2}>
          {text}
        </AppText>
      ) : (
        <Ionicons name={icon} size={20} color={filled ? colors.textOnDark : colors.text} />
      )}
      {badge ? (
        <View style={styles.badge} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <AppText style={styles.badgeText} maxFontSizeMultiplier={1}>
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filled: { backgroundColor: colors.inverse },
  pressed: { opacity: 0.8 },
  text: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.text },
  textFilled: { color: colors.textOnDark },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: { fontFamily: fontFamily.bold, fontSize: 10, lineHeight: 12, color: colors.textOnDark },
});
