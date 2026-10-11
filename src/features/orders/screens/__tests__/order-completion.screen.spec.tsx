import { onlineManager } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { MockServer } from "@/services/mock-api/mock-server";

import { OrderCompletionScreen } from "@/features/orders/screens/order-completion.screen";

import { DEMO_STORE_ID } from "@/mocks/store";

import { mockOrders, seedOrders, TEST_NOW } from "@test/order-test-utils";
import { renderWithQuery } from "@test/render-with-query";

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

async function renderCompletion(orderId: string) {
  mockParams = { orderId };
  await seedOrders();
  await renderWithQuery(<OrderCompletionScreen />);
  await screen.findByTestId("ORDER_COMPLETION.TITLE");
}

afterEach(() => {
  onlineManager.setOnline(true);
});

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

    // Ready only shows once the server has confirmed it.
    await waitFor(() =>
      expect(screen.getByTestId("ORDER_COMPLETION.TITLE")).toHaveTextContent(
        L.readyTitle,
      ),
    );
    const saved = await MockServer.getOrders(DEMO_STORE_ID);
    expect(saved.find((o) => o.id === "ORD-7842")?.status).toBe("READY");
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

  it("needs a connection to mark an order ready", async () => {
    await renderCompletion("ORD-7842");
    await act(async () => {
      onlineManager.setOnline(false);
    });

    expect(
      await screen.findByTestId("ORDER_COMPLETION.OFFLINE"),
    ).toBeOnTheScreen();
    expect(screen.getByText(LOCALE.sync.needsConnection)).toBeOnTheScreen();
    expect(screen.getByTestId("ORDER_COMPLETION.CONFIRM_READY")).toBeDisabled();
  });

  it("explains a version conflict and shows the server's latest copy", async () => {
    await renderCompletion("ORD-7842");
    // Another device changes the order after this one loaded it.
    const edited = mockOrders().map((o) =>
      o.id === "ORD-7842" ? { ...o, version: o.version + 1 } : o,
    );
    await MockServer.seedForTest({ now: TEST_NOW, orders: edited });

    await fireEvent.press(screen.getByTestId("ORDER_COMPLETION.CONFIRM_READY"));

    expect(
      await screen.findByText(LOCALE.errors.byCode.VERSION_CONFLICT ?? ""),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("Status: Picking")).toBeOnTheScreen();
  });
});
