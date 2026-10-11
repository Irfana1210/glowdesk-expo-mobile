import { type FC, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { AppText } from "@/components/ui/app-text";

import { colors, fontFamily, spacing } from "@/theme";

import { type HourlySales } from "../types";

const L = LOCALE.dashboard.salesChart;

type Props = {
  data: Array<HourlySales>;
  height?: number;
  /** Called when a bar is tapped or hovered, or with null to close the tooltip. */
  onSelectHour?: (hour: number | null) => void;
  /**
   * The bar showing its tooltip. Pass it with `onSelectHour` so the screen can close the tooltip
   * when the user taps elsewhere; without them the chart keeps its own selection.
   */
  selectedHour?: number | null;
};

type BarKind = "done" | "current" | "upcoming";

/** Hours still to come show as a short dashed outline. */
const UPCOMING_HEIGHT = 18;

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

const TOOLTIP_WIDTH = 116;

/**
 * Sales by hour as a bar chart built from plain views, so there is no charting dependency.
 * Tap a bar, or hover where a pointer is available, to see that hour's sales and target. The
 * heading carries a sentence describing the whole chart, and each bar is a button of its own.
 */
export const SalesChart: FC<Props> = ({
  data,
  height = 92,
  onSelectHour,
  selectedHour: controlledHour,
}) => {
  const [ownHour, setOwnHour] = useState<number | null>(null);
  const selectedHour = controlledHour === undefined ? ownHour : controlledHour;
  const setSelectedHour = onSelectHour ?? setOwnHour;

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
        <AppText
          accessibilityLabel={`${L.title}. ${describeChart(data)}`}
          accessibilityRole="header"
          variant="cardTitle"
        >
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

      <View style={styles.plot}>
        {data.map((point, index) => {
          const kind = kinds[index];
          const upcoming = kind === "upcoming";
          const barHeight = upcoming
            ? UPCOMING_HEIGHT
            : Math.max(4, Math.round((point.sales / max) * height));
          const selected = selectedHour === point.hour;
          const hourLabel = FormatUtils.formatHour(point.hour).replace(
            /(am|pm)$/,
            " $1",
          );
          return (
            <Pressable
              accessibilityHint={L.barHint}
              accessibilityLabel={L.barLabel(
                hourLabel,
                upcoming ? null : FormatUtils.formatCurrency(point.sales),
                FormatUtils.formatCurrency(point.target),
              )}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={point.hour}
              style={[styles.column, selected && styles.columnSelected]}
              testID={`SALES_CHART.BAR.${point.hour}.${kind}`}
              onHoverIn={() => setSelectedHour(point.hour)}
              onHoverOut={() => setSelectedHour(null)}
              onPress={() => setSelectedHour(selected ? null : point.hour)}
            >
              {selected ? (
                <Tooltip
                  align={
                    index < 2
                      ? "start"
                      : index > data.length - 3
                        ? "end"
                        : "center"
                  }
                  bottom={barHeight + 26}
                  hour={hourLabel}
                  point={point}
                  upcoming={upcoming}
                />
              ) : null}
              <View style={[styles.barArea, { height }]}>
                <View
                  style={[
                    styles.bar,
                    upcoming ? styles.upcoming : { height: barHeight },
                    kind === "done" && styles.done,
                    kind === "current" && styles.current,
                    selected && styles.barSelected,
                  ]}
                />
              </View>
              <AppText maxFontSizeMultiplier={1.1} style={styles.hour}>
                {FormatUtils.formatHourShort(point.hour, index === 0)}
              </AppText>
            </Pressable>
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

/** The value callout above a selected bar. Kept on screen at the chart's left and right edges. */
function Tooltip({
  align,
  bottom,
  hour,
  point,
  upcoming,
}: {
  align: "center" | "end" | "start";
  bottom: number;
  hour: string;
  point: HourlySales;
  upcoming: boolean;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.tooltip,
        { bottom },
        align === "start" && styles.tooltipStart,
        align === "center" && styles.tooltipCenter,
        align === "end" && styles.tooltipEnd,
      ]}
      testID="SALES_CHART.TOOLTIP"
    >
      <AppText color="textOnDark" style={styles.tooltipHour}>
        {hour}
      </AppText>
      <AppText color="textOnDark" style={styles.tooltipValue}>
        {upcoming
          ? L.tooltipUpcoming
          : L.tooltipSales(FormatUtils.formatCurrency(point.sales))}
      </AppText>
      <AppText color="textOnDark" style={styles.tooltipTarget}>
        {L.tooltipTarget(FormatUtils.formatCurrency(point.target))}
      </AppText>
    </View>
  );
}

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
  columnSelected: { zIndex: 1 },
  barSelected: { opacity: 0.75 },
  tooltip: {
    position: "absolute",
    width: TOOLTIP_WIDTH,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.emphasis,
  },
  tooltipStart: { left: 0 },
  tooltipCenter: { left: "50%", marginLeft: -TOOLTIP_WIDTH / 2 },
  tooltipEnd: { right: 0 },
  tooltipHour: { fontFamily: fontFamily.regular, fontSize: 11, lineHeight: 14 },
  tooltipValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    lineHeight: 17,
  },
  tooltipTarget: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
  },
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
    height: UPCOMING_HEIGHT,
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
