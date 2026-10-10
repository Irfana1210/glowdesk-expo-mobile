import { render, screen } from "@testing-library/react-native";

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
    expect(screen.getByRole("image", { name: description })).toBeOnTheScreen();
  });

  it("shows a message when nothing has sold yet", async () => {
    await render(<SalesChart data={hourly.map((h) => ({ ...h, sales: 0 }))} />);
    expect(screen.getByTestId("SALES_CHART.EMPTY")).toBeOnTheScreen();
  });
});
