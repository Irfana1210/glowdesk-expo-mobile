import { fireEvent, screen } from '@testing-library/react-native';

import { fetchInventory } from '@/features/inventory/api/inventoryApi';
import { createMockInventory } from '@/mocks/inventory';
import { MOCK_PRODUCTS } from '@/mocks/products';
import { renderWithQuery } from '@test/renderWithQuery';

import { InventoryScreen } from '@/features/inventory/screens/InventoryScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/inventory/api/inventoryApi', () => ({ fetchInventory: jest.fn() }));
const mockedFetch = jest.mocked(fetchInventory);

const cardIds = () => screen.getAllByTestId(/^product-card-/).map((n) => n.props.testID);

beforeEach(() => {
  jest.clearAllMocks();
  mockedFetch.mockResolvedValue(createMockInventory());
});

describe('InventoryScreen', () => {
  it('lists every product with stock and status', async () => {
    await renderWithQuery(<InventoryScreen />);

    expect(await screen.findByText('7 products · 4 need restocking')).toBeOnTheScreen();
    expect(screen.getByText('7 results')).toBeOnTheScreen();
    expect(screen.getByLabelText(/Whipped Body Butter 200ml.*0 available, Out of stock/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/Soft Focus Blush · Rosewood.*3 available, Low stock/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/Fig Leaf Eau de Parfum 50ml.*11 available, In stock/)).toBeOnTheScreen();
  });

  it('filters by category', async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId('inventory-list');

    await fireEvent.press(screen.getByTestId('filter-HAIRCARE'));

    expect(cardIds()).toEqual(['product-card-prod-kr-0555']);
  });

  it('searches by name, SKU and barcode', async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId('inventory-list');

    await fireEvent.changeText(screen.getByTestId('inventory-search'), 'cloud');
    expect(cardIds()).toEqual(['product-card-prod-pp-0917']);

    await fireEvent.changeText(screen.getByTestId('inventory-search'), 'mi-07');
    expect(cardIds()).toEqual(['product-card-prod-mi-0730']);

    await fireEvent.changeText(screen.getByTestId('inventory-search'), MOCK_PRODUCTS.saltwaterToner.barcode);
    expect(cardIds()).toEqual(['product-card-prod-sw-0381']);
  });

  it('shows only items needing replenishment when the toggle is on', async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId('inventory-list');

    await fireEvent.press(screen.getByTestId('low-stock-toggle'));

    expect(screen.getByTestId('low-stock-toggle')).toBeChecked();
    expect(cardIds()).toHaveLength(4);
    expect(screen.getByText('4 results')).toBeOnTheScreen();
  });

  it('shows an empty state with a way to clear filters', async () => {
    await renderWithQuery(<InventoryScreen />);
    await screen.findByTestId('inventory-list');

    await fireEvent.changeText(screen.getByTestId('inventory-search'), 'no such product');
    expect(screen.getByText('No products match')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('7 results')).toBeOnTheScreen();
  });

  it('shows an error state and retries', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Inventory service unavailable'));
    await renderWithQuery(<InventoryScreen />);

    expect(await screen.findByText("Couldn't load inventory")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('inventory-list')).toBeOnTheScreen();
  });

  it('opens product details and the scanner', async () => {
    await renderWithQuery(<InventoryScreen />);
    await fireEvent.press(await screen.findByTestId('product-card-prod-mi-0730'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/inventory/[id]', params: { id: 'prod-mi-0730' } });

    await fireEvent.press(screen.getByTestId('inventory-scan'));
    expect(mockPush).toHaveBeenCalledWith('/inventory/scan');
  });
});
