import { type FC, useCallback, useRef, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { signalScanError } from "@/features/settings/preferences.store";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { BarcodeCamera } from "@/components/scanner/barcode-camera";
import { ManualBarcodeEntry } from "@/components/scanner/manual-barcode-entry";
import { AppText } from "@/components/ui/app-text";
import { ErrorState } from "@/components/ui/error-state";
import { InlineBanner } from "@/components/ui/inline-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SecondaryButton } from "@/components/ui/secondary-button";

import { colors, radius, spacing } from "@/theme";
import { type Order } from "@/types/order";

import { OrderStateMachine } from "../domain/order-state-machine";
import { PickingUtils, type PickResult } from "../domain/picking";
import { useOrderActions } from "../hooks/use-order-actions";
import { useOrder } from "../hooks/use-orders";

const L = LOCALE.orders.scanner;
const C = LOCALE.orders.common;

/** The camera reports the same code many times a second. Ignore repeats inside this window. */
const SAME_CODE_COOLDOWN_MS = 2000;

type Feedback = { message: string; tone: "success" | "error" };

function feedbackFor(result: PickResult): Feedback {
  if (result.ok) {
    const { item } = result;
    return {
      tone: "success",
      message: L.verified(
        item.name,
        item.pickedQuantity,
        item.requiredQuantity,
      ),
    };
  }
  return { tone: "error", message: result.message };
}

export const BarcodeScannerScreen: FC = () => {
  const router = useRouter();
  const { orderId, manual } = useLocalSearchParams<{
    manual?: string;
    orderId: string;
  }>();
  const { isPending, order } = useOrder(orderId);

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else router.replace("/orders");
  }, [router]);

  return (
    <Screen edges={["top", "left", "right"]} testID="BARCODE_SCANNER.SCREEN">
      <AppHeader
        title={
          order
            ? L.title(FormatUtils.formatOrderNumber(order.id))
            : L.titleFallback
        }
        onBack={close}
      />
      {order ? (
        <ScannerContent
          manualFirst={manual === "1"}
          order={order}
          onDone={close}
        />
      ) : isPending ? (
        <LoadingState message={C.loadingOrder} />
      ) : (
        <ErrorState
          message={L.notFoundMessage}
          retryLabel={C.backToOrders}
          title={C.orderNotFound}
          onRetry={() => router.replace("/orders")}
        />
      )}
    </Screen>
  );
};

function ScannerContent({
  order,
  onDone,
  manualFirst = false,
}: {
  manualFirst?: boolean;
  onDone: () => void;
  order: Order;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scanItem } = useOrderActions();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [manualCode, setManualCode] = useState("");
  const lastScan = useRef<{ at: number; code: string } | null>(null);

  const progress = OrderStateMachine.getPickingProgress(order);
  const allVerified =
    progress.totalItems > 0 && progress.verifiedItems === progress.totalItems;
  const remainingItems = order.items.filter(
    (item) => PickingUtils.remainingQuantity(item) > 0,
  );

  const submit = useCallback(
    (code: string): PickResult => {
      const result = scanItem(order.id, code);
      const next = feedbackFor(result);
      setFeedback(next);
      AccessibilityInfo.announceForAccessibility(next.message);
      if (!result.ok) {
        signalScanError();
      }
      return result;
    },
    [order.id, scanItem],
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
      submit(code);
    },
    [submit],
  );

  if (order.status !== "PICKING") {
    return (
      <View style={styles.padded}>
        <InlineBanner
          message={order.status === "NEW" ? L.notStarted : L.closed}
          tone="error"
        />
        <SecondaryButton label={C.backToOrder} onPress={onDone} />
      </View>
    );
  }

  return (
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
        <BarcodeCamera onScan={allVerified ? undefined : handleCameraScan} />

        {feedback ? (
          <InlineBanner
            message={feedback.message}
            testID="BARCODE_SCANNER.SCAN_FEEDBACK"
            tone={feedback.tone}
          />
        ) : null}

        <ProgressBar
          label={L.progress(progress.verifiedItems, progress.totalItems)}
          ratio={progress.ratio}
        />

        {allVerified ? (
          <View style={styles.doneBlock}>
            <InlineBanner message={L.allVerified} tone="success" />
            <PrimaryButton
              icon="checkmark-done-outline"
              label={L.reviewAndComplete}
              testID="BARCODE_SCANNER.REVIEW_COMPLETE"
              onPress={() =>
                router.replace({
                  pathname: "/orders/complete",
                  params: { orderId: order.id },
                })
              }
            />
          </View>
        ) : (
          <>
            <ManualBarcodeEntry
              autoFocus={manualFirst}
              value={manualCode}
              onChangeValue={setManualCode}
              onSubmit={(code) => submit(code).ok}
            />

            <AppText accessibilityRole="header" variant="cardTitle">
              {L.stillToPick}
            </AppText>
            {__DEV__ ? (
              <AppText color="textMuted" variant="supporting">
                Development build: tap an item to fill its barcode.
              </AppText>
            ) : null}
            <View style={styles.remainingList}>
              {remainingItems.map((item) => (
                <Pressable
                  accessibilityLabel={L.remainingAccessibilityLabel(
                    item.name,
                    PickingUtils.remainingQuantity(item),
                    item.barcode,
                  )}
                  accessibilityRole={__DEV__ ? "button" : "text"}
                  disabled={!__DEV__}
                  key={item.id}
                  style={styles.remainingRow}
                  testID={`BARCODE_SCANNER.REMAINING.${item.id}`}
                  onPress={() => setManualCode(item.barcode)}
                >
                  <Ionicons
                    color={colors.disabled}
                    name="ellipse-outline"
                    size={18}
                  />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{item.name}</AppText>
                    <AppText color="textMuted" variant="supporting">
                      {item.barcode}
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">
                    {L.remainingQuantity(PickingUtils.remainingQuantity(item))}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: spacing.lg, gap: spacing.lg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  doneBlock: { gap: spacing.md },
  remainingList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  remainingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
