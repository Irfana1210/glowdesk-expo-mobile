import { createSalesSummary, DEMO_SALES_SUMMARY } from "@/mocks/sales";

const at = (hour: number, minute = 0) => new Date(2026, 9, 10, hour, minute);

describe("createSalesSummary", () => {
  it("shows no sales before the store opens", () => {
    const summary = createSalesSummary(at(8, 30));

    expect(summary.hourly.every((h) => h.sales === 0)).toBe(true);
    expect(summary).toMatchObject({
      labourSpend: 0,
      salesAmount: 0,
      transactionCount: 0,
    });
  });

  it("fills in the hours traded so far, including the current hour", () => {
    const summary = createSalesSummary(at(11, 15));
    const withSales = summary.hourly.filter((h) => h.sales > 0);

    expect(withSales.map((h) => h.hour)).toEqual([9, 10, 11]);
    expect(summary.salesAmount).toBe(1150 + 1980 + 2450);
  });

  it("matches the dashboard's sample figures at 4:40 pm", () => {
    expect(DEMO_SALES_SUMMARY).toMatchObject({
      businessDate: "2026-10-10",
      labourSpend: 3_150,
      salesAmount: 18_500,
      salesTarget: 20_000,
      transactionCount: 215,
    });
    expect(DEMO_SALES_SUMMARY.hourly.find((h) => h.hour === 17)?.sales).toBe(0);
  });

  it("shows the whole day after close, adding up hour by hour", () => {
    const summary = createSalesSummary(at(21, 30));

    expect(summary.hourly.every((h) => h.sales > 0)).toBe(true);
    expect(summary.salesAmount).toBe(
      summary.hourly.reduce((sum, h) => sum + h.sales, 0),
    );
    expect(summary.salesAmount).toBeGreaterThan(18_500);
  });

  it("uses the local date, not the UTC date", () => {
    // 7:30 am in Melbourne is still the previous day in UTC.
    expect(createSalesSummary(at(7, 30)).businessDate).toBe("2026-10-10");
  });
});
