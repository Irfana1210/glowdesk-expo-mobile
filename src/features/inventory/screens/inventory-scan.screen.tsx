import { type FC, useCallback, useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { signalScanError } from "@/features/settings/preferences.store";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { BarcodeCamera } from "@/components/scanner/barcode-camera";
import { ManualBarcodeEntry } from "@/components/scanner/manual-barcode-entry";
import { ErrorState } from "@/components/ui/error-state";
import { InlineBanner } from "@/components/ui/inline-banner";
import { LoadingState } from "@/components/ui/loading-state";

import { spacing } from "@/theme";

import { StockUtils } from "../domain/stock";
import { useInventory } from "../hooks/use-inventory";

const L = LOCALE.inventory.scan;

const SAME_CODE_COOLDOWN_MS = 2000;

/** Scan or type a barcode to jump straight to that product's stock. */
export const InventoryScanScreen: FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inventory = useInventory();
  const [error, setError] = useState<string | null>(null);
  const lastScan = useRef<{ at: number; code: string } | null>(null);
  const navigating = useRef(false);

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else router.replace("/inventory");
  }, [router]);

  const lookup = useCallback(
    (code: string): boolean => {
      if (navigating.current || !inventory.data) {
        return false;
      }
      const result = StockUtils.lookupByBarcode(inventory.data, code);
      if (!result.ok) {
        setError(result.message);
        AccessibilityInfo.announceForAccessibility(result.message);
        signalScanError();
        return false;
      }
      navigating.current = true;
      setError(null);
      router.replace({
        pathname: "/inventory/[id]",
        params: { id: result.item.product.id },
      });
      return true;
    },
    [inventory.data, router],
  );

  const handleCameraScan = useCallback(
    (code: string) => {
      const now = Date.now();
      const previous = lastScan.current;
      if (
        previous &&
        previous.code === code &&
        now - previous.at < SAME_CODE_COOLDOWN_MS
      ) {
        return;
      }
      lastScan.current = { code, at: now };
      lookup(code);
    },
    [lookup],
  );

  let content;
  if (inventory.isPending) {
    content = <LoadingState message={L.loading} />;
  } else if (inventory.isError) {
    content = (
      <ErrorState
        message={inventory.error.message}
        title={L.errorTitle}
        onRetry={() => void inventory.refetch()}
      />
    );
  } else
    content = (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <BarcodeCamera onScan={handleCameraScan} />
          {error ? (
            <InlineBanner
              message={error}
              testID="INVENTORY_SCAN.LOOKUP_ERROR"
              tone="error"
            />
          ) : null}
          <ManualBarcodeEntry submitLabel={L.submitLabel} onSubmit={lookup} />
        </ScrollView>
      </KeyboardAvoidingView>
    );

  return (
    <Screen testID="INVENTORY_SCAN.SCREEN">
      <AppHeader title={L.title} onBack={close} />
      {content}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
});
