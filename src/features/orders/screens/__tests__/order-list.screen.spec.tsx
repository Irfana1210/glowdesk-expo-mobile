import { fireEvent, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { OrderListScreen } from "@/features/orders/screens/order-list.screen";
import { OrdersService } from "@/features/orders/services/orders.service";

import { createMockOrders } from "@/mocks/orders";

import { renderWithQuery } from "@test/render-with-query";

const L = LOCALE.orders.list;
const CARD = LOCALE.orders.card;
const STATUS = LOCALE.orders.status;

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/features/orders/services/orders.service", () => ({
  OrdersService: {
    fetchOrders: jest.fn(),
  },
}));

const mockedFetchOrders = jest.mocked(OrdersService.fetchOrders);

/** The moment the mockups show: Saturday 10 October 2026, 4:40 pm. */
const NOW = new Date(2026, 9, 10, 16, 40);
const orders = () => createMockOrders(NOW);
const cardIds = () =>
  screen
    .getAllByTestId(/^ORDER_LIST\.CARD\./)
    .map((node) => node.props.testID.replace("ORDER_LIST.CARD.", ""));

beforeEach(() => {
  jest.clearAllMocks();
  mockedFetchOrders.mockResolvedValue(orders());
});

describe("OrderListScreen", () => {
  it("loads orders and shows the overdue banner", async () => {
    await renderWithQuery(<OrderListScreen now={NOW} />);

    expect(
      await screen.findByTestId("ORDER_LIST.CARD.ORD-7841"),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("ORDER_LIST.OVERDUE_BANNER")).toHaveTextContent(
      L.overdueBanner(3),
      { exact: false },
    );
    expect(mockedFetchOrders).toHaveBeenCalledTimes(1);
  });

  it("sorts overdue orders first, most overdue at the top", async () => {
    await renderWithQuery(<OrderListScreen now={NOW} />);
    await screen.findByTestId("ORDER_LIST");

    expect(cardIds().slice(0, 4)).toEqual([
      "ORD-7841",
      "ORD-7845",
      "ORD-7846",
      "ORD-7843",
    ]);
  });

  it("shows the mockup details on each card", async () => {
    await renderWithQuery(<OrderListScreen now={NOW} />);
    await screen.findByTestId("ORDER_LIST");

    expect(
      screen.getByLabelText(
        CARD.accessibilityLabel(
          "7841",
          STATUS.picking,
          CARD.overdue("53 min"),
          "Jordan Lee",
          CARD.itemCount(5),
        ),
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("ORDER_LIST.CARD.ORD-7841")).toHaveTextContent(
      CARD.summary(CARD.itemCount(5), "1:47 pm"),
      { exact: false },
    );
    expect(
      screen.getByLabelText(
        CARD.accessibilityLabel(
          "7843",
          STATUS.picking,
          CARD.due("4:44 pm"),
          "Leo Martin",
          CARD.itemCount(2),
        ),
      ),
    ).toBeOnTheScreen();
  });

  it("shows counts for every filter and filters by status", async () => {
    await renderWithQuery(<OrderListScreen now={NOW} />);
    await screen.findByTestId("ORDER_LIST");

    expect(screen.getByLabelText("All, 20 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("New, 7 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("Picking, 5 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("Ready, 5 orders")).toBeOnTheScreen();
    expect(screen.getByLabelText("Collected, 2 orders")).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId("FILTER_CHIPS.OPTION.READY"));

    expect(screen.getByTestId("FILTER_CHIPS.OPTION.READY")).toBeSelected();
    expect(cardIds()).toEqual([
      "ORD-7840",
      "ORD-7838",
      "ORD-7837",
      "ORD-7835",
      "ORD-7833",
    ]);
    expect(
      screen.getByLabelText(
        CARD.accessibilityLabel(
          "7840",
          STATUS.ready,
          CARD.waiting("3h"),
          CARD.packedBy("Aisha Rahman"),
          CARD.itemCount(
            orders().find((o) => o.id === "ORD-7840")?.items.length ?? 0,
          ),
        ),
      ),
    ).toBeOnTheScreen();
  });

  it("searches by order number, initials or team member", async () => {
    await renderWithQuery(<OrderListScreen now={NOW} />);
    await screen.findByTestId("ORDER_LIST");

    await fireEvent.press(screen.getByTestId("ORDER_LIST.TOGGLE_SEARCH"));
    await fireEvent.changeText(
      screen.getByTestId("ORDER_LIST.SEARCH"),
      "grace",
    );
    expect(cardIds()).toEqual(["ORD-7845", "ORD-7844"]);

    await fireEvent.changeText(screen.getByTestId("ORDER_LIST.SEARCH"), "k.o");
    expect(cardIds()).toEqual(["ORD-7842"]);

    await fireEvent.changeText(screen.getByTestId("ORDER_LIST.SEARCH"), "zzz");
    expect(screen.getByTestId("ORDER_LIST.EMPTY_STATE")).toHaveTextContent(
      L.empty.noMatch("zzz"),
    );
  });

  it("shows an empty message when a filter has no orders", async () => {
    mockedFetchOrders.mockResolvedValue(
      orders().filter((o) => o.status === "NEW"),
    );
    await renderWithQuery(<OrderListScreen now={NOW} />);
    await screen.findByTestId("ORDER_LIST");

    await fireEvent.press(screen.getByTestId("FILTER_CHIPS.OPTION.COLLECTED"));
    expect(screen.getByTestId("ORDER_LIST.EMPTY_STATE")).toHaveTextContent(
      L.empty.collected,
    );
  });

  it("hides the banner when nothing is overdue", async () => {
    mockedFetchOrders.mockResolvedValue(
      orders().filter((o) => o.status === "READY"),
    );
    await renderWithQuery(<OrderListScreen now={NOW} />);
    await screen.findByTestId("ORDER_LIST");

    expect(
      screen.queryByTestId("ORDER_LIST.OVERDUE_BANNER"),
    ).not.toBeOnTheScreen();
  });

  it("shows an error state and recovers on retry", async () => {
    mockedFetchOrders.mockRejectedValueOnce(
      new Error("Network request failed"),
    );
    await renderWithQuery(<OrderListScreen now={NOW} />);

    expect(await screen.findByText(L.loadErrorTitle)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByTestId("ORDER_LIST.CARD.ORD-7841"),
    ).toBeOnTheScreen();
  });

  it("opens order details when a card is pressed", async () => {
    await renderWithQuery(<OrderListScreen now={NOW} />);
    await fireEvent.press(
      await screen.findByTestId("ORDER_LIST.CARD.ORD-7841"),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/orders/[id]",
      params: { id: "ORD-7841" },
    });
  });
});
