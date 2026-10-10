import { type FC } from "react";
import { StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { AppText } from "@/components/ui/app-text";

import { colors, fontFamily, spacing } from "@/theme";

import { type HourlySales } from "../types";

const L = LOCALE.dashboard.salesChart;

type Props = {
  data: Array<HourlySales>;
  height?: number;
};

type BarKind = "done" | "current" | "upcoming";

/** The latest hour with sales is "this hour"; hours after it are still to come. */
export function classifyHours(data: Array<HourlySales>): Array<BarKind> {
  let lastWithSales = -1;
  data.forEach((point, index) => {
    if (point.sales > 0) {
      lastWithSales = index;
    }
  });
  return data.map((_, index) =>
    index < lastWithSales
      ? "done"
      : index === lastWithSales
        ? "current"
        : "upcoming",
  );
}

export function peakHour(data: Array<HourlySales>): HourlySales | null {
  return data.reduce<HourlySales | null>(
    (best, p) => (p.sales > (best?.sales ?? 0) ? p : best),
    null,
  );
}

export function describeChart(data: Array<HourlySales>): string {
  const kinds = classifyHours(data);
  const peak = peakHour(data);
  const traded = data.filter((_, i) => kinds[i] !== "upcoming");
  const upcoming = data.filter((_, i) => kinds[i] === "upcoming");
  if (!peak || traded.length === 0) {
    return L.noSalesSummary;
  }
  const range = (points: Array<HourlySales>) =>
    L.hourRange(
      FormatUtils.formatHour(points[0]!.hour),
      FormatUtils.formatHour(points[points.length - 1]!.hour),
    );
  const summary = L.summary(
    range(traded),
    FormatUtils.formatCurrency(peak.sales),
    FormatUtils.formatHour(peak.hour),
  );
  return upcoming.length > 0
    ? `${summary} ${L.stillToCome(range(upcoming))}`
    : summary;
}

/**
 * Sales by hour as a bar chart built from plain views, so there is no charting dependency.
 * The whole chart is one image for screen readers, with a sentence describing it.
 */
export const SalesChart: FC<Props> = ({ data, height = 92 }) => {
  if (data.length === 0 || data.every((p) => p.sales === 0)) {
    return (
      <View style={styles.container}>
        <AppText accessibilityRole="header" variant="cardTitle">
          {L.title}
        </AppText>
        <AppText color="textMuted" testID="SALES_CHART.EMPTY">
          {L.empty}
        </AppText>
      </View>
    );
  }

  const kinds = classifyHours(data);
  const max = Math.max(...data.map((p) => p.sales), 1);
  const peak = peakHour(data);

  return (
    <View style={styles.container} testID="SALES_CHART">
      <View style={styles.header}>
        <AppText accessibilityRole="header" variant="cardTitle">
          {L.title}
        </AppText>
        {peak ? (
          <AppText
            color="textMuted"
            testID="SALES_CHART.PEAK"
            variant="supporting"
          >
            {L.peak(
              FormatUtils.formatHour(peak.hour).replace(/(am|pm)$/, " $1"),
              FormatUtils.formatCurrency(peak.sales),
            )}
          </AppText>
        ) : null}
      </View>

      <View
        accessible
        accessibilityLabel={describeChart(data)}
        accessibilityRole="image"
        style={styles.plot}
      >
        {data.map((point, index) => {
          const kind = kinds[index];
          return (
            <View
              key={point.hour}
              style={styles.column}
              testID={`SALES_CHART.BAR.${point.hour}.${kind}`}
            >
              <View style={[styles.barArea, { height }]}>
                <View
                  style={[
                    styles.bar,
                    kind === "upcoming"
                      ? styles.upcoming
                      : {
                          height: Math.max(
                            4,
                            Math.round((point.sales / max) * height),
                          ),
                        },
                    kind === "done" && styles.done,
                    kind === "current" && styles.current,
                  ]}
                />
              </View>
              <AppText maxFontSizeMultiplier={1.1} style={styles.hour}>
                {FormatUtils.formatHourShort(point.hour, index === 0)}
              </AppText>
            </View>
          );
        })}
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.legend}
      >
        <LegendKey label={L.legend.done} swatch={styles.done} />
        <LegendKey label={L.legend.thisHour} swatch={styles.current} />
        <LegendKey
          label={L.legend.stillToCome}
          swatch={styles.legendUpcoming}
        />
      </View>
    </View>
  );
};

function LegendKey({ label, swatch }: { label: string; swatch: object }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, swatch]} />
      <AppText color="textMuted" variant="supporting">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  plot: { flexDirection: "row", gap: 6, alignItems: "flex-end" },
  column: { flex: 1, alignItems: "center", gap: 6 },
  barArea: { width: "100%", justifyContent: "flex-end" },
  bar: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  done: { backgroundColor: colors.accent },
  current: { backgroundColor: colors.accentSoft },
  upcoming: {
    height: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#A49CA6",
  },
  hour: {
    fontFamily: fontFamily.regular,
    fontSize: 10,
    lineHeight: 13,
    color: colors.textMuted,
  },
  legend: { flexDirection: "row", gap: spacing.lg },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendUpcoming: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#A49CA6",
  },
});
