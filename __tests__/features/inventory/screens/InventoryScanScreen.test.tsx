import { fireEvent, screen } from "@testing-library/react-native";

import { InventoryScanScreen } from "@/features/inventory/screens/InventoryScanScreen";

import { MOCK_PRODUCTS } from "@/mocks/products";

import { renderWithQuery } from "@test/renderWithQuery";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: mockReplace,
  }),
}));
jest.mock("@/features/inventory/api/inventoryApi", () => ({
  // Loaded lazily because jest.mock factories cannot use imported bindings.
  fetchInventory: jest.fn(() =>
    Promise.resolve(
      jest.requireActual("@/mocks/inventory").createMockInventory(),
    ),
  ),
}));
jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [
    { granted: true, canAskAgain: true, status: "granted" },
    jest.fn(),
  ],
  CameraView: () => null,
}));

async function enter(code: string) {
  await fireEvent.changeText(await screen.findByTestId("manual-barcode"), code);
  await fireEvent.press(screen.getByTestId("manual-submit"));
}

beforeEach(() => jest.clearAllMocks());

describe("InventoryScanScreen", () => {
  it("opens the product for a known barcode", async () => {
    await renderWithQuery(<InventoryScanScreen />);
    await enter(MOCK_PRODUCTS.koriHairOil.barcode);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/inventory/[id]",
      params: { id: "prod-kr-0555" },
    });
  });

  it("explains an unknown barcode and stays on the scanner", async () => {
    await renderWithQuery(<InventoryScanScreen />);
    await enter("9999999999994");
    expect(screen.getByTestId("lookup-error")).toHaveTextContent(
      /No product in this store has barcode 9999999999994/,
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
