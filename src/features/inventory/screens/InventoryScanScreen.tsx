import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signalScanError } from '@/features/settings/usePreferencesStore';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { BarcodeCamera } from '@/components/scanner/BarcodeCamera';
import { ManualBarcodeEntry } from '@/components/scanner/ManualBarcodeEntry';
import { ErrorState, InlineBanner, LoadingState } from '@/components/ui';
import { spacing } from '@/theme';

import { findByBarcode } from '../domain/stock';
import { useInventory } from '../hooks/useInventory';

const SAME_CODE_COOLDOWN_MS = 2000;

/** Scan or type a barcode to jump straight to that product's stock. */
export function InventoryScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inventory = useInventory();
  const [error, setError] = useState<string | null>(null);
  const lastScan = useRef<{ code: string; at: number } | null>(null);
  const navigating = useRef(false);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/inventory');
  }, [router]);

  const lookup = useCallback(
    (code: string): boolean => {
      if (navigating.current || !inventory.data) return false;
      const result = findByBarcode(inventory.data, code);
      if (!result.ok) {
        setError(result.message);
        AccessibilityInfo.announceForAccessibility(result.message);
        signalScanError();
        return false;
      }
      navigating.current = true;
      setError(null);
      router.replace({ pathname: '/inventory/[id]', params: { id: result.item.product.id } });
      return true;
    },
    [inventory.data, router],
  );

  const handleCameraScan = useCallback(
    (code: string) => {
      const now = Date.now();
      const previous = lastScan.current;
      if (previous && previous.code === code && now - previous.at < SAME_CODE_COOLDOWN_MS) return;
      lastScan.current = { code, at: now };
      lookup(code);
    },
    [lookup],
  );

  let content;
  if (inventory.isPending) content = <LoadingState message="Loading inventory" />;
  else if (inventory.isError)
    content = (
      <ErrorState
        title="Couldn't load inventory"
        message={inventory.error.message}
        onRetry={() => void inventory.refetch()}
      />
    );
  else
    content = (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          keyboardShouldPersistTaps="handled"
        >
          <BarcodeCamera onScan={handleCameraScan} />
          {error ? <InlineBanner tone="error" message={error} testID="lookup-error" /> : null}
          <ManualBarcodeEntry onSubmit={lookup} submitLabel="Find product" />
        </ScrollView>
      </KeyboardAvoidingView>
    );

  return (
    <Screen testID="inventory-scan-screen">
      <AppHeader title="Scan product" onBack={close} />
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg },
});
