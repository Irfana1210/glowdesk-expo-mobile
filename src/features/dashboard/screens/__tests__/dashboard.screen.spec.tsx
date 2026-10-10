import { fireEvent, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { DashboardScreen } from "@/features/dashboard/screens/dashboard.screen";
import { SalesService } from "@/features/dashboard/services/sales.service";
import { InventoryService } from "@/features/inventory/services/inventory.service";
import { useRosterStore } from "@/features/roster/store/roster.store";

import { createMockInventory } from "@/mocks/inventory";
import { createMockOrders } from "@/mocks/orders";
import { DEMO_SALES_SUMMARY } from "@/mocks/sales";
import { createMockShifts } from "@/mocks/shifts";

import { resetOrdersStore } from "@test/order-test-utils";
import { renderWithQuery } from "@test/render-with-query";

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
jest.mock("@/features/orders/services/orders.service", () => ({
  OrdersService: {
    fetchOrders: jest.fn().mockResolvedValue([]),
  },
}));

const mockedFetchSales = jest.mocked(SalesService.fetchStoreSalesSummary);
const mockedFetchInventory = jest.mocked(InventoryService.fetchInventory);

/** Saturday 10 October 2026, 4:40 pm: the moment the Dashboard mockup shows. */
const NOW = new Date(2026, 9, 10, 16, 40);

beforeEach(() => {
  jest.clearAllMocks();
  resetOrdersStore({ orders: createMockOrders(NOW), loadStatus: "ready" });
  useRosterStore.setState({ shifts: createMockShifts(NOW) });
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
      screen.getByLabelText(`5:00 ${L.shiftCard.stats.nextBreak}`),
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
    expect(
      screen.getByTestId("DASHBOARD.ATTENTION.breakCover"),
    ).toHaveTextContent(L.attention.breakCover.title("5:00 pm"), {
      exact: false,
    });
    expect(
      screen.getByRole("button", {
        name: L.screen.notificationsLabel(3),
      }),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("DASHBOARD.ATTENTION.orders"));
    expect(mockNavigate).toHaveBeenCalledWith("/orders");
  });

  it("shows the brief sample KPIs with correct calculations", async () => {
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

  it("opens settings from the profile button", async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);
    await fireEvent.press(screen.getByTestId("DASHBOARD.PROFILE"));
    expect(mockPush).toHaveBeenCalledWith("/more/settings");
  });
});
