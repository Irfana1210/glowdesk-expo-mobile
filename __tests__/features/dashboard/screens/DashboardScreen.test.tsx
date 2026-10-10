import { fireEvent, screen } from '@testing-library/react-native';

import { fetchStoreSalesSummary } from '@/features/dashboard/api/salesApi';
import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen';
import { fetchInventory } from '@/features/inventory/api/inventoryApi';
import { createMockInventory } from '@/mocks/inventory';
import { createMockOrders } from '@/mocks/orders';
import { DEMO_SALES_SUMMARY } from '@/mocks/sales';
import { resetOrdersStore } from '@test/orderTestUtils';
import { renderWithQuery } from '@test/renderWithQuery';
import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { createMockShifts } from '@/mocks/shifts';

const mockNavigate = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush }),
}));
jest.mock('@/features/dashboard/api/salesApi', () => ({ fetchStoreSalesSummary: jest.fn() }));
jest.mock('@/features/inventory/api/inventoryApi', () => ({ fetchInventory: jest.fn() }));
jest.mock('@/features/orders/api/ordersApi', () => ({ fetchOrders: jest.fn().mockResolvedValue([]) }));

const mockedFetchSales = jest.mocked(fetchStoreSalesSummary);
const mockedFetchInventory = jest.mocked(fetchInventory);

/** Saturday 10 October 2026, 4:40 pm: the moment the Dashboard mockup shows. */
const NOW = new Date(2026, 9, 10, 16, 40);

beforeEach(() => {
  jest.clearAllMocks();
  resetOrdersStore({ orders: createMockOrders(NOW), loadStatus: 'ready' });
  useRosterStore.setState({ shifts: createMockShifts(NOW) });
  mockedFetchSales.mockResolvedValue(DEMO_SALES_SUMMARY);
  mockedFetchInventory.mockResolvedValue(createMockInventory());
});

describe('DashboardScreen', () => {
  it('greets the user and shows their shift', async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(screen.getByRole('header', { name: 'Hi, Alex' })).toBeOnTheScreen();
    expect(screen.getByText('Sat 10 Oct · Melbourne Central')).toBeOnTheScreen();
    expect(screen.getByTestId('shift-card')).toHaveTextContent(/On shift.*9:00 am – 5:30 pm.*50 min left/);
    expect(screen.getByLabelText('4 on the floor')).toBeOnTheScreen();
    expect(screen.getByLabelText('5:00 next break')).toBeOnTheScreen();
    expect(screen.getByLabelText('7 orders to assign')).toBeOnTheScreen();
  });

  it('lists what needs attention and opens the right tab', async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(await screen.findByTestId('attention-stock')).toHaveTextContent(/4 products low or out/);
    expect(screen.getByTestId('attention-orders')).toHaveTextContent(/3 orders overdue/);
    expect(screen.getByTestId('attention-breakCover')).toHaveTextContent(/Break cover at 5:00 pm/);
    expect(screen.getByRole('button', { name: 'Notifications, 3 items need attention' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('attention-orders'));
    expect(mockNavigate).toHaveBeenCalledWith('/orders');
  });

  it('shows the brief sample KPIs with correct calculations', async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(await screen.findByTestId('sales-total')).toHaveTextContent('$18,500');
    expect(screen.getByText('$1,500 to go · target $20,000')).toBeOnTheScreen();
    expect(screen.getByText('92.5%')).toBeOnTheScreen();
    expect(screen.getByTestId('kpi-transactions-value')).toHaveTextContent('215');
    expect(screen.getByTestId('kpi-atv-value')).toHaveTextContent('$86.05');
    expect(screen.getByTestId('kpi-labour-value')).toHaveTextContent('17.0%');
    expect(screen.getByText('$3,150 of sales')).toBeOnTheScreen();
    expect(screen.getByTestId('kpi-orders-value')).toHaveTextContent('12');
    expect(screen.getByText('5 ready to collect')).toBeOnTheScreen();
  });

  it('shows "not available" instead of dividing by zero before the first sale', async () => {
    mockedFetchSales.mockResolvedValue({ ...DEMO_SALES_SUMMARY, salesAmount: 0, transactionCount: 0, hourly: [] });
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(await screen.findByTestId('kpi-atv-value')).toHaveTextContent('—');
    expect(screen.getByLabelText('Average transaction value, not available')).toBeOnTheScreen();
    expect(screen.getByTestId('sales-chart-empty')).toBeOnTheScreen();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeOnTheScreen();
  });

  it('shows an error state for sales and recovers on retry', async () => {
    mockedFetchSales.mockRejectedValueOnce(new Error('Sales service unavailable'));
    await renderWithQuery(<DashboardScreen now={NOW} />);

    expect(await screen.findByText("Couldn't load sales")).toBeOnTheScreen();
    expect(screen.getByTestId('kpi-orders-value')).toHaveTextContent('12');

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('sales-total')).toHaveTextContent('$18,500');
  });

  it('opens settings from the profile button', async () => {
    await renderWithQuery(<DashboardScreen now={NOW} />);
    await fireEvent.press(screen.getByTestId('profile'));
    expect(mockPush).toHaveBeenCalledWith('/more/settings');
  });
});
