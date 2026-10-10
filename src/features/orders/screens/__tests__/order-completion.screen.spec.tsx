import { fireEvent, render, screen } from "@testing-library/react-native";

import { OrderCompletionScreen } from "@/features/orders/screens/order-completion.screen";

import { mockOrders, resetOrdersStore } from "@test/order-test-utils";

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
      screen.getByLabelText("Verified products: 1 of 1"),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("Units picked: 1 of 1")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("confirm-ready"));

    expect(screen.getByTestId("completion-title")).toHaveTextContent(
      "Ready for collection",
    );
    expect(screen.getByLabelText("Status: Ready")).toBeOnTheScreen();
    expect(screen.getByLabelText("Final status: Ready")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("back-to-orders"));
    expect(mockDismissTo).toHaveBeenCalledWith("/orders");
  });

  it("shows an error and disables confirmation for an incomplete order", async () => {
    await renderCompletion("ORD-7841");

    expect(screen.getByTestId("completion-error")).toHaveTextContent(
      /3 items still to verify/,
    );
    expect(screen.getByTestId("confirm-ready")).toBeDisabled();
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
  });

  it("shows an invalid transition error for an order that is not picking", async () => {
    await renderCompletion("ORD-7846");

    expect(screen.getByTestId("completion-error")).toHaveTextContent(
      /Only orders in Picking can be marked ready/,
    );
    expect(screen.getByTestId("confirm-ready")).toBeDisabled();
  });
});
