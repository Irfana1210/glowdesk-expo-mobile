import { fireEvent, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { InventoryScanScreen } from "@/features/inventory/screens/inventory-scan.screen";

import { MOCK_PRODUCTS } from "@/mocks/products";

import { renderWithQuery } from "@test/render-with-query";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: mockReplace,
  }),
}));
jest.mock("@/features/inventory/services/inventory.service", () => ({
  InventoryService: {
    // Loaded lazily because jest.mock factories cannot use imported bindings.
    fetchInventory: jest.fn(() =>
      Promise.resolve(
        jest.requireActual("@/mocks/inventory").createMockInventory(),
      ),
    ),
  },
}));
jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [
    { granted: true, canAskAgain: true, status: "granted" },
    jest.fn(),
  ],
  CameraView: () => null,
}));

async function enter(code: string) {
  await fireEvent.changeText(
    await screen.findByTestId("MANUAL_BARCODE_ENTRY.BARCODE"),
    code,
  );
  await fireEvent.press(screen.getByTestId("MANUAL_BARCODE_ENTRY.SUBMIT"));
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
    expect(screen.getByTestId("INVENTORY_SCAN.LOOKUP_ERROR")).toHaveTextContent(
      LOCALE.inventory.barcodeLookup.notFound("9999999999994"),
      { exact: false },
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
