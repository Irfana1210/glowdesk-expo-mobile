import { fireEvent, render, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import {
  classifyHours,
  describeChart,
  peakHour,
  SalesChart,
} from "@/features/dashboard/components/sales-chart";

import { DEMO_SALES_SUMMARY } from "@/mocks/sales";

const L = LOCALE.dashboard.salesChart;
const hourly = DEMO_SALES_SUMMARY.hourly;
/** The tooltip repeats the bar's label, so it is hidden from screen readers. */
const HIDDEN = { includeHiddenElements: true };
const tooltip = () => screen.getByTestId("SALES_CHART.TOOLTIP", HIDDEN);

describe("SalesChart", () => {
  it("marks finished hours, this hour and hours still to come", () => {
    expect(classifyHours(hourly)).toEqual([
      "done",
      "done",
      "done",
      "done",
      "done",
      "done",
      "done",
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("shows the peak hour like the mockup", async () => {
    await render(<SalesChart data={hourly} />);
    expect(peakHour(hourly)?.hour).toBe(13);
    expect(screen.getByTestId("SALES_CHART.PEAK")).toHaveTextContent(
      L.peak("1 pm", "$3,310"),
    );
    expect(screen.getByTestId("SALES_CHART.BAR.16.current")).toBeOnTheScreen();
    expect(screen.getByTestId("SALES_CHART.BAR.20.upcoming")).toBeOnTheScreen();
  });

  it("describes the whole chart in one sentence for screen readers", async () => {
    await render(<SalesChart data={hourly} />);
    const description = describeChart(hourly);
    expect(description).toBe(
      `${L.summary(L.hourRange("9am", "4pm"), "$3,310", "1pm")} ${L.stillToCome(L.hourRange("5pm", "8pm"))}`,
    );
    expect(
      screen.getByRole("header", { name: `${L.title}. ${description}` }),
    ).toBeOnTheScreen();
  });

  it("shows an hour's sales and target when its bar is tapped, and hides it on a second tap", async () => {
    await render(<SalesChart data={hourly} />);
    expect(
      screen.queryByTestId("SALES_CHART.TOOLTIP", HIDDEN),
    ).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("SALES_CHART.BAR.13.done"));
    expect(tooltip()).toHaveTextContent(
      `1 pm${L.tooltipSales("$3,310")}${L.tooltipTarget("$2,200")}`,
    );
    expect(screen.getByTestId("SALES_CHART.BAR.13.done")).toBeSelected();

    await fireEvent.press(screen.getByTestId("SALES_CHART.BAR.13.done"));
    expect(
      screen.queryByTestId("SALES_CHART.TOOLTIP", HIDDEN),
    ).not.toBeOnTheScreen();
  });

  it("moves the tooltip to another bar and says when an hour is still to come", async () => {
    await render(<SalesChart data={hourly} />);

    await fireEvent.press(screen.getByTestId("SALES_CHART.BAR.9.done"));
    await fireEvent.press(screen.getByTestId("SALES_CHART.BAR.18.upcoming"));

    expect(screen.getAllByTestId("SALES_CHART.TOOLTIP", HIDDEN)).toHaveLength(
      1,
    );
    expect(tooltip()).toHaveTextContent(
      `6 pm${L.tooltipUpcoming}${L.tooltipTarget("$2,000")}`,
    );
  });

  it("labels each bar for screen readers", async () => {
    await render(<SalesChart data={hourly} />);
    expect(
      screen.getByRole("button", {
        name: L.barLabel("9 am", "$1,150", "$900"),
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: L.barLabel("8 pm", null, "$1,200") }),
    ).toBeOnTheScreen();
  });

  it("shows a message when nothing has sold yet", async () => {
    await render(<SalesChart data={hourly.map((h) => ({ ...h, sales: 0 }))} />);
    expect(screen.getByTestId("SALES_CHART.EMPTY")).toBeOnTheScreen();
  });
});
