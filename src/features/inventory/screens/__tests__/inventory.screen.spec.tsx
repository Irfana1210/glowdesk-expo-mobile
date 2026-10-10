import { fireEvent, screen } from "@testing-library/react-native";

import { InventoryScreen } from "@/features/inventory/screens/inventory.screen";
import { fetchInventory } from "@/features/inventory/services/inventory.service";

import { createMockInventory } from "@/mocks/inventory";
import { MOCK_PRODUCTS } from "@/mocks/products";

import { renderWithQuery } from "@test/render-with-query";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/features/inventory/services/inventory.service", () => ({
  fetchInventory: jest.fn(),
}));
const mockedFetch = jest.mocked(fetchInventory);

const rowIds = () =>
  screen.getAllByTestId(/^product-row-/).map((n) => n.props.testID as string);

beforeEach(() => {
  jest.clearAllMocks();
  mockedFetch.mockResolvedValue(createMockInventory());
});

describe("InventoryScreen", () => {
  it("shows the stock summary and every product with its status", async () => {
    await renderWithQuery(<InventoryScreen />);

    expect(await screen.findByTestId("summary-products")).toHaveTextContent(
      /7.*products/,
    );
    expect(screen.getByTestId("summary-low")).toHaveTextContent(/3.*low stock/);
    expect(screen.getByTestId("summary-out")).toHaveTextContent(
      /1.*out of stock/,
    );
    expect(rowIds()).toHaveLength(7);
    expect(
      screen.getByLabelText(
        /Hearth & Hollow Whipped Body Butter 200ml, Body Care · SKU HH-1180, 0 on hand, Out of stock/,
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        /Velour Soft Focus Blush · Rosewood, Makeup · SKU VL-2210, 3 on hand, Low stock/,
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        /Maison Iris Fig Leaf Eau de Parfum 50ml, Fragrance · SKU MI-0730, 11 on hand, In stock/,
      ),
    ).toBeOnTheScreen();
  });

  it("filters by category", async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId("inventory-list");

    await fireEvent.press(screen.getByTestId("filter-HAIRCARE"));

    expect(screen.getByTestId("filter-HAIRCARE")).toBeSelected();
    expect(rowIds()).toEqual(["product-row-prod-kr-0555"]);
  });

  it("searches by name, SKU and barcode", async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId("inventory-list");

    await fireEvent.changeText(screen.getByTestId("inventory-search"), "cloud");
    expect(rowIds()).toEqual(["product-row-prod-pp-0917"]);

    await fireEvent.changeText(screen.getByTestId("inventory-search"), "mi-07");
    expect(rowIds()).toEqual(["product-row-prod-mi-0730"]);

    await fireEvent.changeText(
      screen.getByTestId("inventory-search"),
      MOCK_PRODUCTS.saltwaterToner.barcode,
    );
    expect(rowIds()).toEqual(["product-row-prod-sw-0381"]);
  });

  it("narrows to products needing restock from the summary tiles, and back", async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId("inventory-list");

    await fireEvent.press(screen.getByTestId("summary-low"));
    expect(screen.getByTestId("summary-low")).toBeSelected();
    expect(screen.getByTestId("summary-out")).toBeSelected();
    expect(rowIds()).toHaveLength(4);

    await fireEvent.press(screen.getByTestId("summary-out"));
    expect(screen.getByTestId("summary-low")).not.toBeSelected();
    expect(rowIds()).toHaveLength(7);
  });

  it("shows an empty message with a way to clear filters", async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId("inventory-list");

    await fireEvent.changeText(
      screen.getByTestId("inventory-search"),
      "no such product",
    );
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      'No products match "no such product".',
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Clear filters" }),
    );
    expect(rowIds()).toHaveLength(7);
    expect(screen.getByTestId("inventory-search").props.value).toBe("");
  });

  it("shows an error state and retries", async () => {
    mockedFetch.mockRejectedValueOnce(
      new Error("Inventory service unavailable"),
    );
    await renderWithQuery(<InventoryScreen />);

    expect(
      await screen.findByText("Couldn't load inventory"),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("inventory-list")).toBeOnTheScreen();
  });

  it("opens product details and the scanner", async () => {
    await renderWithQuery(<InventoryScreen />);
    await fireEvent.press(
      await screen.findByTestId("product-row-prod-mi-0730"),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/inventory/[id]",
      params: { id: "prod-mi-0730" },
    });

    await fireEvent.press(screen.getByTestId("inventory-scan"));
    expect(mockPush).toHaveBeenCalledWith("/inventory/scan");
  });
});
