import { fireEvent, render, screen } from '@testing-library/react-native';
import Storage from 'expo-sqlite/kv-store';
import { Vibration } from 'react-native';

import { useOrdersStore } from '@/features/orders/store/useOrdersStore';
import { useRosterStore } from '@/features/roster/store/useRosterStore';
import { PREFERENCES_STORAGE_KEY, signalScanError, usePreferencesStore } from '@/features/settings/usePreferencesStore';
import { mockOrders, resetOrdersStore } from '@test/orderTestUtils';
import { resetRosterStore } from '@test/rosterTestUtils';

import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn(), dismissTo: mockDismissTo }),
}));
jest.mock('@/features/orders/api/ordersApi', () => ({
  fetchOrders: jest.fn(() => Promise.resolve(jest.requireActual('@test/orderTestUtils').mockOrders())),
}));

beforeEach(() => {
  jest.clearAllMocks();
  usePreferencesStore.getState().resetPreferences();
  resetOrdersStore({ orders: mockOrders(), loadStatus: 'ready' });
  resetRosterStore();
});

describe('SettingsScreen', () => {
  it('shows the profile, assigned store and app version', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByLabelText('Alex, Store Manager, demo account')).toBeOnTheScreen();
    expect(screen.getByLabelText('Store: RetailOS Melbourne Central')).toBeOnTheScreen();
    expect(screen.getByLabelText('Trading hours: 9:00 am – 9:00 pm')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^App version: /)).toBeOnTheScreen();
    expect(screen.queryByText(/Team Member/)).not.toBeOnTheScreen();
  });

  it('saves notification preferences and says they are not delivered yet', async () => {
    await render(<SettingsScreen />);

    await fireEvent(screen.getByTestId('pref-notify-rosterChanges'), 'valueChange', true);

    expect(usePreferencesStore.getState().notifications.rosterChanges).toBe(true);
    const saved = JSON.parse((await Storage.getItem(PREFERENCES_STORAGE_KEY)) ?? '{}');
    expect(saved.state.notifications.rosterChanges).toBe(true);
    expect(screen.getByTestId('notifications-note')).toHaveTextContent(/not sent yet/);
  });

  it('turns scan-error vibration off for the scanners', async () => {
    const vibrate = jest.spyOn(Vibration, 'vibrate');
    await render(<SettingsScreen />);

    signalScanError();
    expect(vibrate).toHaveBeenCalledTimes(1);

    await fireEvent(screen.getByTestId('pref-vibrate'), 'valueChange', false);
    signalScanError();
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it('resets demo data after confirmation', async () => {
    useOrdersStore.getState().startPicking('ORD-7846');
    const [first] = useRosterStore.getState().shifts;
    useRosterStore.getState().removeShift(first!.id);
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('reset-demo-data'));
    expect(screen.getByText('Reset demo data?')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('confirm-action'));

    expect(await screen.findByTestId('settings-message')).toHaveTextContent(/Demo orders and roster restored/);
    expect(useOrdersStore.getState().orders.find((o) => o.id === 'ORD-7846')?.status).toBe('NEW');
    expect(useRosterStore.getState().shifts.length).toBeGreaterThan(0);
  });

  it('signs out by clearing device data and preferences, then returns to the dashboard', async () => {
    usePreferencesStore.getState().setVibrateOnScanError(false);
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('sign-out'));
    expect(screen.getByText('Sign out?')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('confirm-action'));

    expect(mockDismissTo).toHaveBeenCalledWith('/dashboard');
    expect(usePreferencesStore.getState().vibrateOnScanError).toBe(true);
  });

  it('does nothing if sign out is cancelled', async () => {
    await render(<SettingsScreen />);
    await fireEvent.press(screen.getByTestId('sign-out'));
    await fireEvent.press(screen.getByTestId('cancel-action'));
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});
