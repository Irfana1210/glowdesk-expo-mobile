import { onlineManager } from "@tanstack/react-query";
import { act, screen, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { ORDERS_CACHE_KEY } from "@/services/cache-keys";

import { OrderMutations } from "@/features/orders/hooks/order-mutations";
import { OrdersService } from "@/features/orders/services/orders.service";

import { ConnectivityBanner } from "@/components/layout/connectivity-banner";

import { DEMO_STORE_ID } from "@/mocks/store";

import { mockOrders, seedOrders } from "@test/order-test-utils";
import {
  createTestQueryClient,
  renderWithQuery,
} from "@test/render-with-query";

const L = LOCALE.sync;

/** Queues a scan the way the scanner does, without a screen. */
function queueScan(client: ReturnType<typeof createTestQueryClient>) {
  const order = mockOrders().find((o) => o.id === "ORD-7841");
  const barcode = order?.items.find((i) => i.id === "ORD-7841-L2")?.barcode;
  void client
    .getMutationCache()
    .build(client, { mutationKey: OrderMutations.QUEUED_KEY })
    .execute({
      command: { barcode: barcode ?? "", type: "SCAN_ITEM" },
      expectedVersion: order?.version ?? 0,
      orderId: "ORD-7841",
      storeId: DEMO_STORE_ID,
    })
    .catch(() => undefined);
}

beforeEach(async () => {
  onlineManager.setOnline(true);
  await seedOrders();
});

afterEach(() => {
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
});

describe("ConnectivityBanner", () => {
  it("is hidden while online with nothing waiting", async () => {
    await renderWithQuery(<ConnectivityBanner />);
    expect(screen.toJSON()).toBeNull();
  });

  it("says the app is offline and that saved data is showing", async () => {
    onlineManager.setOnline(false);
    await renderWithQuery(<ConnectivityBanner />);

    expect(screen.getByTestId("CONNECTIVITY_BANNER.OFFLINE")).toBeOnTheScreen();
    expect(screen.getByText(L.offlineTitle)).toBeOnTheScreen();
    expect(screen.getByText(L.offlineSaved)).toBeOnTheScreen();
  });

  it("counts changes waiting offline, then shows them syncing when the connection returns", async () => {
    const client = createTestQueryClient();
    await client.query({
      queryFn: () => OrdersService.fetchOrders(DEMO_STORE_ID),
      queryKey: [ORDERS_CACHE_KEY, DEMO_STORE_ID],
    });
    onlineManager.setOnline(false);
    await renderWithQuery(<ConnectivityBanner />, client);

    await act(async () => {
      queueScan(client);
      queueScan(client);
    });
    expect(
      await screen.findByText(L.offlineWaiting(L.changes(2))),
    ).toBeOnTheScreen();

    // Hold the first request so the syncing state stays on screen until released.
    let release: () => void = () => undefined;
    const send = OrdersService.updateOrder;
    jest.spyOn(OrdersService, "updateOrder").mockImplementationOnce(
      (input) =>
        new Promise((resolve, reject) => {
          release = () => void send(input).then(resolve, reject);
        }),
    );
    await act(async () => {
      onlineManager.setOnline(true);
    });
    expect(await screen.findByText(L.syncing(L.changes(2)))).toBeOnTheScreen();

    await act(async () => {
      release();
    });
    await waitFor(() =>
      expect(
        screen.queryByTestId("CONNECTIVITY_BANNER.SYNCING"),
      ).not.toBeOnTheScreen(),
    );
  });
});
