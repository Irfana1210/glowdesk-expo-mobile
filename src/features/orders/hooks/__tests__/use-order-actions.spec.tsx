import { type ReactNode } from "react";

import {
  dehydrate,
  hydrate,
  onlineManager,
  type QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { ORDERS_CACHE_KEY } from "@/services/cache-keys";
import { useMockNetworkStore } from "@/services/mock-api/mock-network.store";
import { MockServer } from "@/services/mock-api/mock-server";

import { useOrderActions } from "@/features/orders/hooks/use-order-actions";
import { OrdersService } from "@/features/orders/services/orders.service";

import { DEMO_STORE_ID } from "@/mocks/store";
import { type Order } from "@/types/order";

import { mockOrders, seedOrders, TEST_NOW } from "@test/order-test-utils";
import { createTestQueryClient } from "@test/render-with-query";

const KEY = [ORDERS_CACHE_KEY, DEMO_STORE_ID];
// ORD-7841 is being picked; its second line still needs two units.
const LINE = mockOrders()
  .find((o) => o.id === "ORD-7841")
  ?.items.find((i) => i.id === "ORD-7841-L2");
const BARCODE = LINE?.barcode ?? "";

const cachedQuantity = (client: QueryClient) =>
  client
    .getQueryData<Array<Order>>(KEY)
    ?.find((o) => o.id === "ORD-7841")
    ?.items.find((i) => i.id === LINE?.id)?.pickedQuantity;

/** Reads the server directly, so it works while the device is offline. */
const serverOrder = async (id: string) =>
  (await MockServer.snapshotForTest()).orders.find((o) => o.id === id);

const serverQuantity = async () =>
  (await serverOrder("ORD-7841"))?.items.find((i) => i.id === LINE?.id)
    ?.pickedQuantity;

/** A client with the orders already loaded, like a device that opened the Orders tab. */
async function loadedClient(): Promise<QueryClient> {
  const client = createTestQueryClient();
  await client.query({
    queryFn: () => OrdersService.fetchOrders(DEMO_STORE_ID),
    queryKey: KEY,
  });
  return client;
}

async function renderActions(client: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useOrderActions(), { wrapper });
}

beforeEach(async () => {
  onlineManager.setOnline(true);
  await seedOrders();
});

afterEach(() => {
  onlineManager.setOnline(true);
  useMockNetworkStore.getState().reset();
  jest.restoreAllMocks();
});

describe("useOrderActions offline queue", () => {
  it("shows a scan straight away offline and sends it when the connection returns", async () => {
    const client = await loadedClient();
    const { result } = await renderActions(client);
    onlineManager.setOnline(false);

    await act(async () => {
      expect(result.current.scanItem("ORD-7841", BARCODE).ok).toBe(true);
    });

    expect(cachedQuantity(client)).toBe(1);
    expect(await serverQuantity()).toBe(0);
    expect(client.getMutationCache().getAll()[0]?.state.isPaused).toBe(true);

    await act(async () => {
      onlineManager.setOnline(true);
    });

    await waitFor(async () => expect(await serverQuantity()).toBe(1));
  });

  it("sends queued changes in order, each based on the version before it", async () => {
    const client = await loadedClient();
    const { result } = await renderActions(client);
    onlineManager.setOnline(false);

    await act(async () => {
      result.current.scanItem("ORD-7841", BARCODE);
      result.current.scanItem("ORD-7841", BARCODE);
    });
    expect(cachedQuantity(client)).toBe(2);

    await act(async () => {
      onlineManager.setOnline(true);
    });

    await waitFor(async () => expect(await serverQuantity()).toBe(2));
  });

  it("keeps waiting changes through an app restart", async () => {
    const before = await loadedClient();
    const { result } = await renderActions(before);
    onlineManager.setOnline(false);
    await act(async () => {
      result.current.scanItem("ORD-7841", BARCODE);
    });
    // What the persister writes to the device: cached data plus the paused change.
    const saved = JSON.parse(JSON.stringify(dehydrate(before))) as ReturnType<
      typeof dehydrate
    >;
    before.clear();

    // The app opens again with a new client and the connection back.
    const after = createTestQueryClient();
    hydrate(after, saved);
    expect(cachedQuantity(after)).toBe(1);
    onlineManager.setOnline(true);
    await act(async () => {
      await after.resumePausedMutations();
    });

    await waitFor(async () => expect(await serverQuantity()).toBe(1));
  });

  it("retries a change the server briefly failed, so the changes queued after it still apply", async () => {
    const client = await loadedClient();
    const { result } = await renderActions(client);
    // The first send hits a simulated 503; every request after it succeeds.
    useMockNetworkStore.setState({ failRequests: true });
    jest.spyOn(Math, "random").mockReturnValueOnce(0).mockReturnValue(0.99);

    await act(async () => {
      result.current.scanItem("ORD-7841", BARCODE);
      result.current.scanItem("ORD-7841", BARCODE);
    });

    await waitFor(async () => expect(await serverQuantity()).toBe(2), {
      timeout: 5000,
    });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(cachedQuantity(client)).toBe(2);
  });

  it("rolls back to the server's copy when another device changed the order", async () => {
    const client = await loadedClient();
    const { result } = await renderActions(client);
    // Another device moves ORD-7846 on after this device loaded it.
    await MockServer.seedForTest({
      now: TEST_NOW,
      orders: mockOrders().map((o) =>
        o.id === "ORD-7846" ? { ...o, version: o.version + 1 } : o,
      ),
    });

    await act(async () => {
      expect(result.current.startPicking("ORD-7846").ok).toBe(true);
    });

    await waitFor(() => {
      const order = client
        .getQueryData<Array<Order>>(KEY)
        ?.find((o) => o.id === "ORD-7846");
      expect(order?.status).toBe("NEW");
      expect(order?.version).toBe(
        (mockOrders().find((o) => o.id === "ORD-7846")?.version ?? 0) + 1,
      );
    });
  });

  it("explains a rule break without sending anything", async () => {
    const client = await loadedClient();
    const { result } = await renderActions(client);

    // ORD-7841 is already being picked.
    let outcome: ReturnType<typeof result.current.startPicking> = { ok: true };
    await act(async () => {
      outcome = result.current.startPicking("ORD-7841");
    });

    expect(outcome.ok).toBe(false);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
});

describe("useOrderActions confirmed changes", () => {
  it("needs a connection to mark an order ready", async () => {
    const client = await loadedClient();
    const { result } = await renderActions(client);
    onlineManager.setOnline(false);

    let outcome: Awaited<ReturnType<typeof result.current.markReady>> = {
      ok: true,
    };
    await act(async () => {
      outcome = await result.current.markReady("ORD-7842");
    });

    expect(outcome).toEqual({
      message: LOCALE.sync.needsConnection,
      ok: false,
    });
    expect((await serverOrder("ORD-7842"))?.status).toBe("PICKING");
  });

  it("marks an order ready only after the server confirms it", async () => {
    const client = await loadedClient();
    const { result } = await renderActions(client);

    await act(async () => {
      expect(await result.current.markReady("ORD-7842")).toEqual({ ok: true });
    });

    expect((await serverOrder("ORD-7842"))?.status).toBe("READY");
    expect(
      client.getQueryData<Array<Order>>(KEY)?.find((o) => o.id === "ORD-7842")
        ?.status,
    ).toBe("READY");
  });
});
