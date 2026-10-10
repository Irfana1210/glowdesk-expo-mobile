import { screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { ProductDetailsScreen } from "@/features/inventory/screens/product-details.screen";

import { renderWithQuery } from "@test/render-with-query";

const L = LOCALE.inventory.productDetails;

let mockParams: { id?: string } = {};
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
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

async function renderProduct(id: string) {
  mockParams = { id };
  await renderWithQuery(<ProductDetailsScreen />);
}

describe("ProductDetailsScreen", () => {
  it("shows product information and stock", async () => {
    await renderProduct("prod-vl-2210");

    expect(
      await screen.findByText("Soft Focus Blush · Rosewood"),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("available-quantity")).toHaveTextContent("3");
    expect(
      screen.getByLabelText(L.rowLabel(L.fields.sku, "VL-2210")),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(L.rowLabel(L.fields.category, "Makeup")),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(L.rowLabel(L.fields.price, "$42.00")),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("stock-message")).toHaveTextContent(
      L.stockMessage.lowStock(3, 5),
      { exact: false },
    );
  });

  it("explains out of stock items", async () => {
    await renderProduct("prod-hh-1180");
    expect(
      await screen.findByLabelText(
        `Status: ${LOCALE.inventory.stockStatus.outOfStock}`,
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("stock-message")).toHaveTextContent(
      L.stockMessage.outOfStock,
      { exact: false },
    );
  });

  it("shows not found for an unknown product", async () => {
    await renderProduct("prod-999");
    expect(await screen.findByText(L.notFoundTitle)).toBeOnTheScreen();
  });
});
