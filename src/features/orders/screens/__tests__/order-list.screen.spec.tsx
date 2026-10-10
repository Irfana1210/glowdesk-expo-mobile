import { fireEvent, render, screen } from "@testing-library/react-native";

import { OrderListScreen } from "@/features/orders/screens/order-list.screen";
import { fetchOrders } from "@/features/orders/services/orders.service";

import { createMockOrders } from "@/mocks/orders";

import { resetOrdersStore } from "@test/order-test-utils";
import { resetRosterStore } from "@test/roster-test-utils";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/features/orders/services/orders.service", () => ({
  fetchOrders: jest.fn(),
}));

const mockedFetchOrders = jest.mocked(fetchOrders);

/** The moment the mockups show: Saturday 10 October 2026, 4:40 pm. */
const NOW = new Date(2026, 9, 10, 16, 40);
const orders = () => createMockOrders(NOW);
const cardIds = () =>
  screen
    .getAllByTestId(/^order-card-/)
    .map((node) => node.props.testID.replace("order-card-", ""));

beforeEach(() => {
  jest.clearAllMocks();
  resetOrdersStore();
  resetRosterStore();
  mockedFetchOrders.mockResolvedValue(orders());
});

describe("OrderListScreen", () => {
  it("loads orders and shows the overdue banner", async () => {
    await render(<OrderListScreen now={NOW} />);

    expect(await screen.findByTestId("order-card-ORD-7841")).toBeOnTheScreen();
    expect(screen.getByTestId("overdue-banner")).toHaveTextContent(
      /3 overdue · shown first/,
    );
    expect(mockedFetchOrders).toHaveBeenCalledTimes(1);
  });

  it("sorts overdue orders first, most overdue at the top", async () => {
    await render(<OrderListScreen now={NOW} />);
    await screen.findByTestId("order-list");

    expect(cardIds().slice(0, 4)).toEqual([
      "ORD-7841",
      "ORD-7845",
      "ORD-7846",
      "ORD-7843",
    ]);
  });

  it("shows the mockup details on each card", async () => {
    await render(<OrderListScreen now={NOW} />);
    await screen.findByTestId("order-list");

    expect(
      screen.getByLabelText(
        "Order 7841, Picking, Overdue 53 min, Jordan Lee, 5 items",
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("order-card-ORD-7841")).toHaveTextContent(
      /placed 1:47 pm/,
    );
    expect(
      screen.getByLabelText(
        "Order 7843, Picking, Due 4:44 pm, Leo Martin, 2 items",
      ),
    ).toBeOnTheScreen();
  });

  it("shows counts for every filter and filters by status", async () => {
    await render(<OrderListScreen now={NOW} />);
    await screen.findByTestId("order-list");

    expect(screen.getByLabelText("All, 20 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("New, 7 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("Picking, 5 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("Ready, 5 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("Collected, 2 orders")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("filter-READY"));

    expect(screen.getByTestId("filter-READY")).toBeSelected();
    expect(cardIds()).toEqual([
      "ORD-7840",
      "ORD-7838",
      "ORD-7837",
      "ORD-7835",
      "ORD-7833",
    ]);
    expect(
      screen.getByLabelText(
        /^Order 7840, Ready, Waiting 3h, Packed by Aisha Rahman/,
      ),
    ).toBeOnTheScreen();
  });

  it("searches by order number, initials or team member", async () => {
    await render(<OrderListScreen now={NOW} />);
    await screen.findByTestId("order-list");

    await fireEvent.press(screen.getByTestId("toggle-search"));
    await fireEvent.changeText(screen.getByTestId("order-search"), "grace");
    expect(cardIds()).toEqual(["ORD-7845", "ORD-7844"]);

    await fireEvent.changeText(screen.getByTestId("order-search"), "k.o");
    expect(cardIds()).toEqual(["ORD-7842"]);

    await fireEvent.changeText(screen.getByTestId("order-search"), "zzz");
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      'No orders match "zzz".',
    );
  });

  it("shows an empty message when a filter has no orders", async () => {
    mockedFetchOrders.mockResolvedValue(
      orders().filter((o) => o.status === "NEW"),
    );
    await render(<OrderListScreen now={NOW} />);
    await screen.findByTestId("order-list");

    await fireEvent.press(screen.getByTestId("filter-COLLECTED"));
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      "No collected orders.",
    );
  });

  it("hides the banner when nothing is overdue", async () => {
    mockedFetchOrders.mockResolvedValue(
      orders().filter((o) => o.status === "READY"),
    );
    await render(<OrderListScreen now={NOW} />);
    await screen.findByTestId("order-list");

    expect(screen.queryByTestId("overdue-banner")).not.toBeOnTheScreen();
  });

  it("shows an error state and recovers on retry", async () => {
    mockedFetchOrders.mockRejectedValueOnce(
      new Error("Network request failed"),
    );
    await render(<OrderListScreen now={NOW} />);

    expect(await screen.findByText("Couldn't load orders")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("order-card-ORD-7841")).toBeOnTheScreen();
  });

  it("opens order details when a card is pressed", async () => {
    await render(<OrderListScreen now={NOW} />);
    await fireEvent.press(await screen.findByTestId("order-card-ORD-7841"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/orders/[id]",
      params: { id: "ORD-7841" },
    });
  });
});
