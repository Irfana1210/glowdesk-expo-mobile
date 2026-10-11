import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { MockServer } from "@/services/mock-api/mock-server";

import { OrderDetailsScreen } from "@/features/orders/screens/order-details.screen";

import { createMockOrders } from "@/mocks/orders";
import { DEMO_STORE_ID } from "@/mocks/store";

import { seedOrders } from "@test/order-test-utils";
import { renderWithQuery } from "@test/render-with-query";

const L = LOCALE.orders.details;

let mockParams: { id?: string } = {};
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: jest.fn(),
    push: mockPush,
  }),
  useLocalSearchParams: () => mockParams,
}));

/** Saturday 10 October 2026, 4:40 pm: the moment the Order Details mockup shows. */
const NOW = new Date(2026, 9, 10, 16, 40);
/** The server's copy of an order. */
const serverOrder = async (id: string) =>
  (await MockServer.getOrders(DEMO_STORE_ID)).find((o) => o.id === id);

beforeEach(() => {
  jest.clearAllMocks();
});

async function renderOrder(id: string) {
  mockParams = { id };
  await seedOrders(createMockOrders(NOW), NOW);
  await renderWithQuery(<OrderDetailsScreen now={NOW} />);
  await waitFor(() =>
    expect(
      screen.queryByText(LOCALE.orders.common.loadingOrder),
    ).not.toBeOnTheScreen(),
  );
}

describe("OrderDetailsScreen", () => {
  it("shows the order summary from the mockup", async () => {
    await renderOrder("ORD-7841");

    expect(
      screen.getByRole("header", {
        name: L.orderNumberAccessibilityLabel("7841"),
      }),
    ).toHaveTextContent(L.orderNumber("7841"));
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
    expect(screen.getByText(L.customer("J.L."))).toBeOnTheScreen();
    expect(screen.getByTestId("ORDER_DETAILS.TIMING")).toHaveTextContent(
      L.placed("1:47 pm") + L.due("3:47 pm"),
    );
    expect(screen.getByTestId("ORDER_DETAILS.OVERDUE_PILL")).toHaveTextContent(
      L.overdue("53 min"),
      { exact: false },
    );
    expect(
      await screen.findByText("Jordan Lee", { exact: false }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("ORDER_DETAILS.ASSIGNEE")).toHaveTextContent(
      `${L.assignedToPrefix}Jordan Lee`,
    );
    expect(
      screen.getByRole("progressbar", {
        name: L.progressAccessibilityLabel(2, 6),
      }),
    ).toHaveAccessibilityValue({ now: 33 });
  });

  it("lists every product with Verified or To scan", async () => {
    await renderOrder("ORD-7841");

    expect(screen.getByText(L.productsHeading(5))).toBeOnTheScreen();
    expect(screen.getAllByTestId(/^ORDER_DETAILS\.ITEM\./)).toHaveLength(5);
    expect(
      screen.getByTestId("ORDER_DETAILS.ITEM.ORD-7841-L1"),
    ).toHaveTextContent(L.productDetail("LS-1042", "9300601042118"), {
      exact: false,
    });
    expect(
      screen.getByTestId("ORDER_DETAILS.ITEM.ORD-7841-L1"),
    ).toHaveTextContent(
      /LUMEN SKIN.*Dewy Barrier Cream 50ml.*1 \/ 1.*Verified/,
    );
    expect(
      screen.getByTestId("ORDER_DETAILS.ITEM.ORD-7841-L2"),
    ).toHaveTextContent(/0 \/ 2.*To scan/);
  });

  it("keeps Mark ready disabled until every unit is verified, and says why", async () => {
    await renderOrder("ORD-7841");

    expect(screen.getByTestId("ORDER_DETAILS.MARK_READY")).toBeDisabled();
    expect(screen.getByTestId("ORDER_DETAILS.READY_HELPER")).toHaveTextContent(
      L.scanMoreUnits(4),
    );
  });

  it("opens the scanner, or manual entry with Type code", async () => {
    await renderOrder("ORD-7841");

    await fireEvent.press(screen.getByTestId("ORDER_DETAILS.SCAN_PRODUCT"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/orders/scan",
      params: { orderId: "ORD-7841" },
    });

    await fireEvent.press(screen.getByTestId("ORDER_DETAILS.TYPE_CODE"));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/orders/scan",
      params: { orderId: "ORD-7841", manual: "1" },
    });
  });

  it("sends a fully verified order to the completion check", async () => {
    await renderOrder("ORD-7842");

    expect(screen.getByTestId("ORDER_DETAILS.MARK_READY")).toBeEnabled();
    expect(
      screen.queryByTestId("ORDER_DETAILS.SCAN_PRODUCT"),
    ).not.toBeOnTheScreen();
    expect(screen.getByTestId("ORDER_DETAILS.READY_HELPER")).toHaveTextContent(
      L.allUnitsVerified,
    );

    await fireEvent.press(screen.getByTestId("ORDER_DETAILS.MARK_READY"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/orders/complete",
      params: { orderId: "ORD-7842" },
    });
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
  });

  it("starts picking a New order straight away and syncs it to the server", async () => {
    await renderOrder("ORD-7846");
    expect(screen.getByTestId("ORDER_DETAILS.ASSIGNEE")).toHaveTextContent(
      L.notAssigned,
    );

    await fireEvent.press(screen.getByTestId("ORDER_DETAILS.START_PICKING"));

    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
    expect(
      screen.queryByTestId("ORDER_DETAILS.START_PICKING"),
    ).not.toBeOnTheScreen();
    await waitFor(async () =>
      expect((await serverOrder("ORD-7846"))?.status).toBe("PICKING"),
    );
  });

  it("reassigns the order to another team member", async () => {
    await renderOrder("ORD-7841");

    await screen.findByText("Jordan Lee", { exact: false });
    await fireEvent.press(screen.getByTestId("ORDER_DETAILS.REASSIGN"));
    expect(
      screen.queryByTestId("ORDER_DETAILS.ASSIGN_SHEET.OPTION.emp-07"),
    ).not.toBeOnTheScreen(); // inactive
    await fireEvent.press(
      screen.getByTestId("ORDER_DETAILS.ASSIGN_SHEET.OPTION.emp-03"),
    );

    expect(screen.getByTestId("ORDER_DETAILS.ASSIGNEE")).toHaveTextContent(
      `${L.assignedToPrefix}Grace Liu`,
    );
    await waitFor(async () =>
      expect((await serverOrder("ORD-7841"))?.assigneeId).toBe("emp-03"),
    );
  });

  it("cancels an order after confirmation", async () => {
    await renderOrder("ORD-7846");

    await fireEvent.press(screen.getByTestId("ORDER_DETAILS.MORE_ACTIONS"));
    expect(screen.getByText(L.cancel.title("7846"))).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByTestId("CONFIRMATION_MODAL.CONFIRM_ACTION"),
    );

    expect(await screen.findByLabelText("Status: Cancelled")).toBeOnTheScreen();
    expect((await serverOrder("ORD-7846"))?.status).toBe("CANCELLED");
    expect(
      screen.queryByTestId("ORDER_DETAILS.MORE_ACTIONS"),
    ).not.toBeOnTheScreen();
  });

  it("hides actions that do not apply to a Ready order", async () => {
    await renderOrder("ORD-7840");

    expect(
      screen.queryByTestId("ORDER_DETAILS.MORE_ACTIONS"),
    ).not.toBeOnTheScreen();
    expect(
      screen.queryByTestId("ORDER_DETAILS.REASSIGN"),
    ).not.toBeOnTheScreen();
    expect(
      await screen.findByText("Aisha Rahman", { exact: false }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("ORDER_DETAILS.ASSIGNEE")).toHaveTextContent(
      `${L.packedByPrefix}Aisha Rahman`,
    );
    expect(
      screen.queryByTestId("ORDER_DETAILS.OVERDUE_PILL"),
    ).not.toBeOnTheScreen();
  });

  it("shows not found for an unknown order id", async () => {
    await renderOrder("ORD-0000");
    expect(
      screen.getByText(LOCALE.orders.common.orderNotFound),
    ).toBeOnTheScreen();
  });
});

describe("OrderDetailsScreen wording", () => {
  it("uses the singular for a one-unit order", async () => {
    await renderOrder("ORD-7842");
    expect(
      screen.getByRole("progressbar", {
        name: L.progressAccessibilityLabel(1, 1),
      }),
    ).toBeOnTheScreen();
  });
});
