import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { BarcodeScannerScreen } from "@/features/orders/screens/barcode-scanner.screen";
import { useOrdersStore } from "@/features/orders/store/orders.store";

import { MOCK_PRODUCTS } from "@/mocks/products";

import { mockOrders, resetOrdersStore } from "@test/order-test-utils";

const L = LOCALE.orders.scanner;
const PICKING = LOCALE.orders.picking;

let mockParams: { manual?: string; orderId?: string } = {};
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock("@/features/orders/services/orders.service", () => ({
  OrdersService: {
    fetchOrders: jest.fn().mockResolvedValue([]),
  },
}));

type MockPermission = {
  canAskAgain: boolean;
  granted: boolean;
  status: string;
} | null;
let mockPermission: MockPermission = {
  granted: true,
  canAskAgain: true,
  status: "granted",
};
let mockCameraProps: {
  onBarcodeScanned?: (result: { data: string; type: string }) => void;
} = {};
jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [mockPermission, jest.fn()],
  CameraView: (props: typeof mockCameraProps) => {
    mockCameraProps = props;
    return null;
  },
}));

const P = MOCK_PRODUCTS;
const pickedQuantity = (orderId: string, sku: string) =>
  useOrdersStore
    .getState()
    .orders.find((o) => o.id === orderId)
    ?.items.find((i) => i.sku === sku)?.pickedQuantity;

async function renderScanner(orderId: string) {
  mockParams = { orderId };
  resetOrdersStore({ orders: mockOrders(), loadStatus: "ready" });
  await render(<BarcodeScannerScreen />);
}

async function typeBarcode(code: string) {
  await fireEvent.changeText(
    screen.getByTestId("MANUAL_BARCODE_ENTRY.BARCODE"),
    code,
  );
  await fireEvent.press(screen.getByTestId("MANUAL_BARCODE_ENTRY.SUBMIT"));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPermission = { granted: true, canAskAgain: true, status: "granted" };
  mockCameraProps = {};
});

describe("BarcodeScannerScreen", () => {
  it("verifies a correct barcode entered manually and clears the field", async () => {
    await renderScanner("ORD-7841");

    await typeBarcode(P.velourBlush.barcode);

    expect(
      screen.getByTestId("BARCODE_SCANNER.SCAN_FEEDBACK"),
    ).toHaveTextContent(L.verified(P.velourBlush.name, 1, 2), { exact: false });
    expect(pickedQuantity("ORD-7841", P.velourBlush.sku)).toBe(1);
    expect(screen.getByTestId("MANUAL_BARCODE_ENTRY.BARCODE").props.value).toBe(
      "",
    );
  });

  it("rejects a product that is not in the order", async () => {
    await renderScanner("ORD-7841");

    await typeBarcode(P.irisParfum.barcode);

    expect(
      screen.getByTestId("BARCODE_SCANNER.SCAN_FEEDBACK"),
    ).toHaveTextContent(PICKING.notInOrder(P.irisParfum.barcode), {
      exact: false,
    });
    expect(screen.getByRole("alert")).toBeOnTheScreen();
  });

  it("prevents over-picking an item that is already complete", async () => {
    await renderScanner("ORD-7841");

    await typeBarcode(P.lumenCream.barcode);

    expect(
      screen.getByTestId("BARCODE_SCANNER.SCAN_FEEDBACK"),
    ).toHaveTextContent(PICKING.alreadyPicked(P.lumenCream.name, 1, 1), {
      exact: false,
    });
    expect(pickedQuantity("ORD-7841", P.lumenCream.sku)).toBe(1);
  });

  it("rejects malformed manual input", async () => {
    await renderScanner("ORD-7841");

    await typeBarcode("12ab");

    expect(
      screen.getByTestId("BARCODE_SCANNER.SCAN_FEEDBACK"),
    ).toHaveTextContent(PICKING.invalidBarcode, { exact: false });
  });

  it("ignores the same code repeated by the camera within the cooldown", async () => {
    await renderScanner("ORD-7841");

    await act(async () => {
      mockCameraProps.onBarcodeScanned?.({
        data: P.velourBlush.barcode,
        type: "ean13",
      });
      mockCameraProps.onBarcodeScanned?.({
        data: P.velourBlush.barcode,
        type: "ean13",
      });
      mockCameraProps.onBarcodeScanned?.({
        data: P.velourBlush.barcode,
        type: "ean13",
      });
    });

    expect(pickedQuantity("ORD-7841", P.velourBlush.sku)).toBe(1);
  });

  it("offers completion and pauses the camera once every item is verified", async () => {
    // ORD-7843 still needs two units of Lumen Skin cream.
    await renderScanner("ORD-7843");

    await typeBarcode(P.lumenCream.barcode);
    await typeBarcode(P.lumenCream.barcode);

    expect(mockCameraProps.onBarcodeScanned).toBeUndefined();
    await fireEvent.press(
      screen.getByTestId("BARCODE_SCANNER.REVIEW_COMPLETE"),
    );
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/orders/complete",
      params: { orderId: "ORD-7843" },
    });
  });

  it("keeps manual entry available when camera access is denied", async () => {
    mockPermission = { granted: false, canAskAgain: false, status: "denied" };
    await renderScanner("ORD-7841");

    expect(screen.getByTestId("BARCODE_CAMERA.PERMISSION")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Open Settings" }),
    ).toBeOnTheScreen();

    await typeBarcode(P.velourBlush.barcode);
    expect(pickedQuantity("ORD-7841", P.velourBlush.sku)).toBe(1);
  });

  it("blocks scanning for an order that has not started picking", async () => {
    await renderScanner("ORD-7846");

    expect(screen.getByText(L.notStarted)).toBeOnTheScreen();
    expect(
      screen.queryByTestId("MANUAL_BARCODE_ENTRY.BARCODE"),
    ).not.toBeOnTheScreen();
  });

  it("focuses manual entry when opened with Type code", async () => {
    mockParams = { orderId: "ORD-7841", manual: "1" };
    resetOrdersStore({ orders: mockOrders(), loadStatus: "ready" });
    await render(<BarcodeScannerScreen />);

    expect(
      screen.getByTestId("MANUAL_BARCODE_ENTRY.BARCODE").props.autoFocus,
    ).toBe(true);
  });
});
