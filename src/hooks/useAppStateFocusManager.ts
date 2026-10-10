import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/**
 * React Native has no window focus event. Tell TanStack Query when the app returns to the
 * foreground so stale data refetches, as recommended in the TanStack Query React Native guide.
 */
export function useAppStateFocusManager(): void {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);
}
