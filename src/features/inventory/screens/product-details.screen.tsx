import { type FC, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { AppText } from "@/components/ui/app-text";
import { ErrorState } from "@/components/ui/error-state";
import { InlineBanner } from "@/components/ui/inline-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { StatusBadge } from "@/components/ui/status-badge";

import { colors, radius, spacing } from "@/theme";
import { CATEGORY_LABELS } from "@/types/product";

import { StockUtils } from "../domain/stock";
import { useInventory } from "../hooks/use-inventory";
import { STOCK_STATUS_META } from "../stock-status-meta";
import { type InventoryItem } from "../types";

const L = LOCALE.inventory.productDetails;

export const ProductDetailsScreen: FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const inventory = useInventory();
  const item = inventory.data?.find((i) => i.product.id === id);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else router.replace("/inventory");
  }, [router]);

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
  } else if (!item) {
    content = (
      <ErrorState
        message={L.notFoundMessage(id ?? "")}
        retryLabel={L.backToInventory}
        title={L.notFoundTitle}
        onRetry={() => router.replace("/inventory")}
      />
    );
  } else content = <ProductDetailsContent item={item} />;

  return (
    <Screen testID="PRODUCT_DETAILS.SCREEN">
      <AppHeader title={L.title} onBack={goBack} />
      {content}
    </Screen>
  );
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      accessible
      accessibilityLabel={L.rowLabel(label, value)}
      style={styles.row}
    >
      <AppText color="textMuted">{label}</AppText>
      <AppText style={styles.rowValue} variant="bodyStrong">
        {value}
      </AppText>
    </View>
  );
}

function stockMessage(item: InventoryItem): {
  message: string;
  tone: "error" | "info" | "success";
} {
  switch (StockUtils.itemStockStatus(item)) {
    case "OUT_OF_STOCK":
      return {
        tone: "error",
        message: L.stockMessage.outOfStock,
      };
    case "LOW_STOCK":
      return {
        tone: "error",
        message: L.stockMessage.lowStock(
          item.availableQuantity,
          item.reorderPoint,
        ),
      };
    default:
      return {
        tone: "success",
        message: L.stockMessage.healthy(item.reorderPoint),
      };
  }
}

function ProductDetailsContent({ item }: { item: InventoryItem }) {
  const insets = useSafeAreaInsets();
  const { product } = item;
  const status = STOCK_STATUS_META[StockUtils.itemStockStatus(item)];
  const message = stockMessage(item);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <View style={styles.hero}>
        <ProductThumbnail
          label={product.brand}
          seed={product.id}
          size={88}
          swatch={product.swatch}
        />
        <AppText color="textMuted" variant="supporting">
          {product.brand}
        </AppText>
        <AppText
          accessibilityRole="header"
          style={styles.center}
          variant="sectionTitle"
        >
          {product.name}
        </AppText>
        <AppText color="textMuted">
          {product.size} · {CATEGORY_LABELS[product.category]}
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.stockTop}>
          <View
            accessible
            accessibilityLabel={L.availableLabel(item.availableQuantity)}
          >
            <AppText color="textMuted" variant="supporting">
              {L.available}
            </AppText>
            <AppText
              testID="PRODUCT_DETAILS.AVAILABLE_QUANTITY"
              variant="pageTitle"
            >
              {item.availableQuantity}
            </AppText>
          </View>
          <StatusBadge {...status} />
        </View>
        <InlineBanner
          message={message.message}
          testID="PRODUCT_DETAILS.STOCK_MESSAGE"
          tone={message.tone}
        />
      </View>

      <View style={styles.card}>
        <AppText accessibilityRole="header" variant="cardTitle">
          {L.infoTitle}
        </AppText>
        <DetailRow label={L.fields.sku} value={product.sku} />
        <DetailRow label={L.fields.barcode} value={product.barcode} />
        <DetailRow
          label={L.fields.category}
          value={CATEGORY_LABELS[product.category]}
        />
        <DetailRow
          label={L.fields.price}
          value={FormatUtils.formatCurrency(product.price, { cents: true })}
        />
        <DetailRow
          label={L.fields.reorderPoint}
          value={String(item.reorderPoint)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  hero: { alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  center: { textAlign: "center" },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stockTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowValue: { flexShrink: 1, textAlign: "right" },
});
