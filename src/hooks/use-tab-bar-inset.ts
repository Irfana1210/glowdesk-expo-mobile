import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Height of the floating tab bar above the home indicator. */
export const TAB_BAR_HEIGHT = 60;

/**
 * Bottom padding a tab screen's scrolling content needs so its last rows are not hidden under
 * the floating glass tab bar, which sits over the content rather than below it.
 */
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom;
}
