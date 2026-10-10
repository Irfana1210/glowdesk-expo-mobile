import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Tab screens skip the bottom edge because the tab bar already handles it. */
  edges?: Edge[];
  testID?: string;
}

export function Screen({ children, edges = ['top', 'left', 'right'], testID }: ScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={edges} testID={testID}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
