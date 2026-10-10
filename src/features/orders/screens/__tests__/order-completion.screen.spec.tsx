import { fireEvent, render, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { OrderCompletionScreen } from "@/features/orders/screens/order-completion.screen";

import { mockOrders, resetOrdersStore } from "@test/order-test-utils";

const L = LOCALE.orders.completion;

let mockParams: { orderId?: string } = {};
const mockDismissTo = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: jest.fn(),
    dismissTo: mockDismissTo,
  }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock("@/features/orders/services/orders.service", () => ({
  OrdersService: {
    fetchOrders: jest.fn().mockResolvedValue([]),
  },
}));

async function renderCompletion(orderId: string) {
  mockParams = { orderId };
  resetOrdersStore({ orders: mockOrders(), loadStatus: "ready" });
  await render(<OrderCompletionScreen />);
}

describe("OrderCompletionScreen", () => {
  it("shows the verified count and confirms a complete order as READY", async () => {
    await renderCompletion("ORD-7842");

    expect(
      screen.getByLabelText(
        L.summaryAccessibilityLabel(L.verifiedProducts, L.ratio(1, 1)),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        L.summaryAccessibilityLabel(L.unitsPicked, L.ratio(1, 1)),
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("ORDER_COMPLETION.CONFIRM_READY"));

    expect(screen.getByTestId("ORDER_COMPLETION.TITLE")).toHaveTextContent(
      L.readyTitle,
    );
    expect(screen.getByLabelText("Status: Ready")).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        L.summaryAccessibilityLabel(L.finalStatus, L.finalReady),
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByTestId("ORDER_COMPLETION.BACK_TO_ORDERS"),
    );
    expect(mockDismissTo).toHaveBeenCalledWith("/orders");
  });

  it("shows an error and disables confirmation for an incomplete order", async () => {
    await renderCompletion("ORD-7841");

    expect(screen.getByTestId("ORDER_COMPLETION.ERROR")).toHaveTextContent(
      L.cannotMarkReady(LOCALE.orders.stateMachine.itemsNotVerified(3)),
      { exact: false },
    );
    expect(screen.getByTestId("ORDER_COMPLETION.CONFIRM_READY")).toBeDisabled();
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
  });

  it("shows an invalid transition error for an order that is not picking", async () => {
    await renderCompletion("ORD-7846");

    expect(screen.getByTestId("ORDER_COMPLETION.ERROR")).toHaveTextContent(
      L.cannotMarkReady(LOCALE.orders.stateMachine.invalidStatus("NEW")),
      { exact: false },
    );
    expect(screen.getByTestId("ORDER_COMPLETION.CONFIRM_READY")).toBeDisabled();
  });
});
