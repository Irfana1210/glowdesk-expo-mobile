import { screen } from "@testing-library/react-native";

import { ProductDetailsScreen } from "@/features/inventory/screens/product-details.screen";

import { renderWithQuery } from "@test/render-with-query";

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
  // Loaded lazily because jest.mock factories cannot use imported bindings.
  fetchInventory: jest.fn(() =>
    Promise.resolve(
      jest.requireActual("@/mocks/inventory").createMockInventory(),
    ),
  ),
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
    expect(screen.getByLabelText("SKU: VL-2210")).toBeOnTheScreen();
    expect(screen.getByLabelText("Category: Makeup")).toBeOnTheScreen();
    expect(screen.getByLabelText("Price: $42.00")).toBeOnTheScreen();
    expect(screen.getByTestId("stock-message")).toHaveTextContent(
      /Low stock\. 3 left, at or below the reorder point of 5\./,
    );
  });

  it("explains out of stock items", async () => {
    await renderProduct("prod-hh-1180");
    expect(
      await screen.findByLabelText("Status: Out of stock"),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("stock-message")).toHaveTextContent(
      /Out of stock\. Reorder now/,
    );
  });

  it("shows not found for an unknown product", async () => {
    await renderProduct("prod-999");
    expect(await screen.findByText("Product not found")).toBeOnTheScreen();
  });
});
