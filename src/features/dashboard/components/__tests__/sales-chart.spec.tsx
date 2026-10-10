import { render, screen } from "@testing-library/react-native";

import {
  classifyHours,
  describeChart,
  peakHour,
  SalesChart,
} from "@/features/dashboard/components/sales-chart";

import { DEMO_SALES_SUMMARY } from "@/mocks/sales";

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
    expect(screen.getByTestId("sales-chart-peak")).toHaveTextContent(
      "Peak 1 pm · $3,310",
    );
    expect(screen.getByTestId("sales-bar-16-current")).toBeOnTheScreen();
    expect(screen.getByTestId("sales-bar-20-upcoming")).toBeOnTheScreen();
  });

  it("describes the whole chart in one sentence for screen readers", async () => {
    await render(<SalesChart data={hourly} />);
    const description = describeChart(hourly);
    expect(description).toBe(
      "Hourly sales from 9am to 4pm, peaking at $3,310 at 1pm. 5pm to 8pm still to come.",
    );
    expect(screen.getByRole("image", { name: description })).toBeOnTheScreen();
  });

  it("shows a message when nothing has sold yet", async () => {
    await render(<SalesChart data={hourly.map((h) => ({ ...h, sales: 0 }))} />);
    expect(screen.getByTestId("sales-chart-empty")).toBeOnTheScreen();
  });
});
