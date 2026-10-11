import { ScrollView } from "react-native";

import { fireEvent, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { MockServer } from "@/services/mock-api/mock-server";

import { DashboardScreen } from "@/features/dashboard/screens/dashboard.screen";
import { SalesService } from "@/features/dashboard/services/sales.service";
import { InventoryService } from "@/features/inventory/services/inventory.service";

import { createMockInventory } from "@/mocks/inventory";
import { createMockOrders } from "@/mocks/orders";
import { DEMO_SALES_SUMMARY } from "@/mocks/sales";
import { createMockShifts } from "@/mocks/shifts";
import { spacing } from "@/theme";

import { renderWithQuery } from "@test/render-with-query";
import { signInAs } from "@test/session-test-utils";

const L = LOCALE.dashboard;

const mockNavigate = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush }),
}));
jest.mock("@/features/dashboard/services/sales.service", () => ({
  SalesService: {
    fetchStoreSalesSummary: jest.fn(),
  },
}));
jest.mock("@/features/inventory/services/inventory.service", () => ({
  InventoryService: {
    fetchInventory: jest.fn(),
  },
}));

const mockedFetchSales = jest.mocked(SalesService.fetchStoreSalesSummary);
const mockedFetchInventory = jest.mocked(InventoryService.fetchInventory);

/** Saturday 10 October 2026, 4:40 pm: the moment the Dashboard mockup shows. */
const NOW = new Date(2026, 9, 10, 16, 40);

beforeEach(async () => {
  jest.clearAllMocks();
  signInAs("manager");
  await MockServer.seedForTest({
    now: NOW,
    orders: createMockOrders(NOW),
    shifts: createMockShifts(NOW),
  });
  mockedFetchSales.mockResolvedValue(DEMO_SALES_SUMMARY);
  mockedFetchInventory.mockResolvedValue(createMockInventory());
});

describe("DashboardScreen", () => {
  it("greets the user and shows their shift", async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(
      screen.getByRole("header", { name: L.screen.greeting("Alex") }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("Sat 10 Oct · Melbourne Central"),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("DASHBOARD.SHIFT_CARD")).toHaveTextContent(
      new RegExp(
        `${L.shiftCard.active.status}.*9:00 am – 5:30 pm.*${L.shiftCard.active.headline("50 min")}`,
      ),
    );
    expect(
      screen.getByLabelText(`4 ${L.shiftCard.stats.onTheFloor}`),
    ).toBeOnTheScreen();
    expect(
      // The next break in the store is Grace's, so the card names her.
      screen.getByLabelText(`5:00 ${L.shiftCard.stats.breakOf("Grace")}`),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`7 ${L.shiftCard.stats.ordersToAssign(7)}`),
    ).toBeOnTheScreen();
  });

  it("lists what needs attention and opens the right tab", async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(
      await screen.findByTestId("DASHBOARD.ATTENTION.stock"),
    ).toHaveTextContent(L.attention.stock.title(4), { exact: false });
    expect(screen.getByTestId("DASHBOARD.ATTENTION.orders")).toHaveTextContent(
      L.attention.orders.title(3),
      { exact: false },
    );
    // Grace's 5 pm break leaves three on the floor, so it needs no cover.
    expect(
      screen.queryByTestId("DASHBOARD.ATTENTION.breakCover"),
    ).not.toBeOnTheScreen();
    expect(
      screen.getByRole("button", {
        name: L.screen.notificationsLabel(2),
      }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("DASHBOARD.ATTENTION.orders"));
    expect(mockNavigate).toHaveBeenCalledWith("/orders");
  });

  it("shows the sample KPIs with correct calculations", async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(
      await screen.findByTestId("DASHBOARD.SALES_TOTAL"),
    ).toHaveTextContent("$18,500");
    expect(
      screen.getByText(L.salesHero.toGo("$1,500", "$20,000")),
    ).toBeOnTheScreen();
    expect(screen.getByText("92.5%")).toBeOnTheScreen();
    expect(
      screen.getByTestId("DASHBOARD.KPI_TRANSACTIONS.VALUE"),
    ).toHaveTextContent("215");
    expect(screen.getByTestId("DASHBOARD.KPI_ATV.VALUE")).toHaveTextContent(
      "$86.05",
    );
    expect(screen.getByTestId("DASHBOARD.KPI_LABOUR.VALUE")).toHaveTextContent(
      "17.0%",
    );
    expect(screen.getByText(L.kpis.labour.ofSales("$3,150"))).toBeOnTheScreen();
    expect(screen.getByTestId("DASHBOARD.KPI_ORDERS.VALUE")).toHaveTextContent(
      "12",
    );
    expect(
      screen.getByText(L.kpis.clickAndCollect.readyToCollect(5)),
    ).toBeOnTheScreen();
  });

  it('shows "not available" instead of dividing by zero before the first sale', async () => {
    mockedFetchSales.mockResolvedValue({
      ...DEMO_SALES_SUMMARY,
      salesAmount: 0,
      transactionCount: 0,
      hourly: [],
    });
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(
      await screen.findByTestId("DASHBOARD.KPI_ATV.VALUE"),
    ).toHaveTextContent(L.kpis.noValue);
    expect(
      screen.getByLabelText(
        L.kpis.averageTransaction.accessibilityLabel(L.kpis.notAvailable),
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("SALES_CHART.EMPTY")).toBeOnTheScreen();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeOnTheScreen();
  });

  it("shows an error state for sales and recovers on retry", async () => {
    mockedFetchSales.mockRejectedValueOnce(
      new Error("Sales service unavailable"),
    );
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(await screen.findByText(L.today.errorTitle)).toBeOnTheScreen();
    expect(screen.getByTestId("DASHBOARD.KPI_ORDERS.VALUE")).toHaveTextContent(
      "12",
    );

    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByTestId("DASHBOARD.SALES_TOTAL"),
    ).toHaveTextContent("$18,500");
  });

  it("scrolls the bell to the attention section, measured from the scroll content", async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
    await renderWithQuery(<DashboardScreen now={NOW} />);

    // onLayout y is relative to the parent: the body sits 140 below the title,
    // and the attention section 260 below the top of the body.
    await fireEvent(screen.getByTestId("DASHBOARD.BODY"), "layout", {
      nativeEvent: { layout: { x: 0, y: 140, width: 390, height: 1200 } },
    });
    await fireEvent(screen.getByTestId("DASHBOARD.ATTENTION"), "layout", {
      nativeEvent: { layout: { x: 0, y: 260, width: 390, height: 300 } },
    });
    await fireEvent.press(screen.getByTestId("DASHBOARD.NOTIFICATIONS"));

    // Lands just above the section so its title isn't flush with the screen edge.
    expect(scrollTo).toHaveBeenCalledWith({
      y: 400 - spacing.md,
      animated: true,
    });
    expect(
      screen.getByTestId("DASHBOARD.ATTENTION.HIGHLIGHT"),
    ).toBeOnTheScreen();
    scrollTo.mockRestore();
  });

  it("closes the sales tooltip when the user touches elsewhere", async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);
    const hidden = { includeHiddenElements: true };

    await fireEvent.press(await screen.findByTestId("SALES_CHART.BAR.13.done"));
    expect(screen.getByTestId("SALES_CHART.TOOLTIP", hidden)).toBeOnTheScreen();

    await fireEvent(
      screen.getByTestId("DASHBOARD.KPI_TRANSACTIONS.VALUE"),
      "touchStart",
    );
    expect(
      screen.queryByTestId("SALES_CHART.TOOLTIP", hidden),
    ).not.toBeOnTheScreen();
  });

  it("opens settings from the profile button", async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);
    await fireEvent.press(screen.getByTestId("DASHBOARD.PROFILE"));
    expect(mockPush).toHaveBeenCalledWith("/more/settings");
  });
});
