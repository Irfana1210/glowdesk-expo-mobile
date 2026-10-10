import { fireEvent, render, screen } from "@testing-library/react-native";

import { OrderDetailsScreen } from "@/features/orders/screens/order-details.screen";
import { useOrdersStore } from "@/features/orders/store/orders.store";

import { createMockOrders } from "@/mocks/orders";

import { resetOrdersStore } from "@test/order-test-utils";
import { resetRosterStore } from "@test/roster-test-utils";

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
jest.mock("@/features/orders/services/orders.service", () => ({
  OrdersService: {
    fetchOrders: jest.fn().mockResolvedValue([]),
  },
}));

/** Saturday 10 October 2026, 4:40 pm: the moment the Order Details mockup shows. */
const NOW = new Date(2026, 9, 10, 16, 40);
const orderOf = (id: string) =>
  useOrdersStore.getState().orders.find((o) => o.id === id);

beforeEach(() => {
  jest.clearAllMocks();
  resetRosterStore();
});

async function renderOrder(id: string) {
  mockParams = { id };
  resetOrdersStore({ orders: createMockOrders(NOW), loadStatus: "ready" });
  await render(<OrderDetailsScreen now={NOW} />);
}

describe("OrderDetailsScreen", () => {
  it("shows the order summary from the mockup", async () => {
    await renderOrder("ORD-7841");

    expect(
      screen.getByRole("header", { name: "Order 7841" }),
    ).toHaveTextContent("#ORD-7841");
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
    expect(screen.getByText("Customer J.L.")).toBeOnTheScreen();
    expect(screen.getByTestId("order-timing")).toHaveTextContent(
      "Placed 1:47 pm · due 3:47 pm",
    );
    expect(screen.getByTestId("overdue-pill")).toHaveTextContent(
      /Overdue 53 min/,
    );
    expect(screen.getByTestId("assignee")).toHaveTextContent(
      "Assigned to Jordan Lee",
    );
    expect(
      screen.getByRole("progressbar", {
        name: "Picking progress: 2 of 6 units picked",
      }),
    ).toHaveAccessibilityValue({ now: 33 });
  });

  it("lists every product with Verified or To scan", async () => {
    await renderOrder("ORD-7841");

    expect(screen.getByText("Products · 5")).toBeOnTheScreen();
    expect(screen.getAllByTestId(/^order-item-/)).toHaveLength(5);
    expect(screen.getByTestId("order-item-ORD-7841-L1")).toHaveTextContent(
      /LUMEN SKIN.*Dewy Barrier Cream 50ml.*SKU LS-1042 · 9300601042118.*1 \/ 1.*Verified/,
    );
    expect(screen.getByTestId("order-item-ORD-7841-L2")).toHaveTextContent(
      /0 \/ 2.*To scan/,
    );
  });

  it("keeps Mark ready disabled until every unit is verified, and says why", async () => {
    await renderOrder("ORD-7841");

    expect(screen.getByTestId("mark-ready")).toBeDisabled();
    expect(screen.getByTestId("ready-helper")).toHaveTextContent(
      "Scan 4 more units to mark this order ready",
    );
  });

  it("opens the scanner, or manual entry with Type code", async () => {
    await renderOrder("ORD-7841");

    await fireEvent.press(screen.getByTestId("scan-product"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/orders/scan",
      params: { orderId: "ORD-7841" },
    });

    await fireEvent.press(screen.getByTestId("type-code"));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/orders/scan",
      params: { orderId: "ORD-7841", manual: "1" },
    });
  });

  it("sends a fully verified order to the completion check", async () => {
    await renderOrder("ORD-7842");

    expect(screen.getByTestId("mark-ready")).toBeEnabled();
    expect(screen.queryByTestId("scan-product")).not.toBeOnTheScreen();
    expect(screen.getByTestId("ready-helper")).toHaveTextContent(
      "All units verified.",
    );

    await fireEvent.press(screen.getByTestId("mark-ready"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/orders/complete",
      params: { orderId: "ORD-7842" },
    });
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
  });

  it("starts picking a New order", async () => {
    await renderOrder("ORD-7846");
    expect(screen.getByTestId("assignee")).toHaveTextContent(
      "Not assigned yet",
    );

    await fireEvent.press(screen.getByTestId("start-picking"));

    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
    expect(screen.queryByTestId("start-picking")).not.toBeOnTheScreen();
  });

  it("reassigns the order to another team member", async () => {
    await renderOrder("ORD-7841");

    await fireEvent.press(screen.getByTestId("reassign"));
    expect(
      screen.queryByTestId("assign-sheet-option-emp-07"),
    ).not.toBeOnTheScreen(); // inactive
    await fireEvent.press(screen.getByTestId("assign-sheet-option-emp-03"));

    expect(screen.getByTestId("assignee")).toHaveTextContent(
      "Assigned to Grace Liu",
    );
    expect(orderOf("ORD-7841")?.assigneeId).toBe("emp-03");
  });

  it("cancels an order after confirmation", async () => {
    await renderOrder("ORD-7846");

    await fireEvent.press(screen.getByTestId("more-actions"));
    expect(screen.getByText("Cancel order #ORD-7846?")).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId("confirm-action"));

    expect(orderOf("ORD-7846")?.status).toBe("CANCELLED");
    expect(screen.getByLabelText("Status: Cancelled")).toBeOnTheScreen();
    expect(screen.queryByTestId("more-actions")).not.toBeOnTheScreen();
  });

  it("hides actions that do not apply to a Ready order", async () => {
    await renderOrder("ORD-7840");

    expect(screen.queryByTestId("more-actions")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("reassign")).not.toBeOnTheScreen();
    expect(screen.getByTestId("assignee")).toHaveTextContent(
      "Packed by Aisha Rahman",
    );
    expect(screen.queryByTestId("overdue-pill")).not.toBeOnTheScreen();
  });

  it("shows not found for an unknown order id", async () => {
    await renderOrder("ORD-0000");
    expect(screen.getByText("Order not found")).toBeOnTheScreen();
  });
});

describe("OrderDetailsScreen wording", () => {
  it("uses the singular for a one-unit order", async () => {
    await renderOrder("ORD-7842");
    expect(
      screen.getByRole("progressbar", {
        name: "Picking progress: 1 of 1 unit picked",
      }),
    ).toBeOnTheScreen();
  });
});
