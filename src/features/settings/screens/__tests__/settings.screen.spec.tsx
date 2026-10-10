import { Vibration } from "react-native";

import { fireEvent, render, screen } from "@testing-library/react-native";
import Storage from "expo-sqlite/kv-store";

import { LOCALE } from "@/constants/locale";

import { useOrdersStore } from "@/features/orders/store/orders.store";
import { useRosterStore } from "@/features/roster/store/roster.store";
import {
  PREFERENCES_STORAGE_KEY,
  signalScanError,
  usePreferencesStore,
} from "@/features/settings/preferences.store";
import { SettingsScreen } from "@/features/settings/screens/settings.screen";

import { mockOrders, resetOrdersStore } from "@test/order-test-utils";
import { resetRosterStore } from "@test/roster-test-utils";

const L = LOCALE.settings;

const mockDismissTo = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    canGoBack: () => true,
    replace: jest.fn(),
    dismissTo: mockDismissTo,
  }),
}));
jest.mock("@/features/orders/services/orders.service", () => ({
  OrdersService: {
    fetchOrders: jest.fn(() =>
      Promise.resolve(
        jest.requireActual("@test/order-test-utils").mockOrders(),
      ),
    ),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  usePreferencesStore.getState().resetPreferences();
  resetOrdersStore({ orders: mockOrders(), loadStatus: "ready" });
  resetRosterStore();
});

describe("SettingsScreen", () => {
  it("shows the profile, assigned store and app version", async () => {
    await render(<SettingsScreen />);

    expect(
      screen.getByLabelText(
        L.profile.accessibilityLabel("Alex", "Store Manager"),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        L.screen.rowLabel(L.store.store, "RetailOS Melbourne Central"),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        L.screen.rowLabel(L.store.tradingHours, "9:00 am – 9:00 pm"),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        new RegExp(`^${L.screen.rowLabel(L.about.appVersion, "")}`),
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/Team Member/)).not.toBeOnTheScreen();
  });

  it("saves notification preferences and says they are not delivered yet", async () => {
    await render(<SettingsScreen />);

    await fireEvent(
      screen.getByTestId("SETTINGS.PREF_NOTIFY.rosterChanges"),
      "valueChange",
      true,
    );

    expect(usePreferencesStore.getState().notifications.rosterChanges).toBe(
      true,
    );
    const saved = JSON.parse(
      (await Storage.getItem(PREFERENCES_STORAGE_KEY)) ?? "{}",
    );
    expect(saved.state.notifications.rosterChanges).toBe(true);
    expect(screen.getByTestId("SETTINGS.NOTIFICATIONS_NOTE")).toHaveTextContent(
      L.notifications.note,
    );
  });

  it("turns scan-error vibration off for the scanners", async () => {
    const vibrate = jest.spyOn(Vibration, "vibrate");
    await render(<SettingsScreen />);

    signalScanError();
    expect(vibrate).toHaveBeenCalledTimes(1);

    await fireEvent(
      screen.getByTestId("SETTINGS.PREF_VIBRATE"),
      "valueChange",
      false,
    );
    signalScanError();
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it("resets demo data after confirmation", async () => {
    useOrdersStore.getState().startPicking("ORD-7846");
    const [first] = useRosterStore.getState().shifts;
    useRosterStore.getState().removeShift(first!.id);
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId("SETTINGS.RESET_DEMO_DATA"));
    expect(screen.getByText(L.reset.confirmTitle)).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByTestId("CONFIRMATION_MODAL.CONFIRM_ACTION"),
    );

    expect(await screen.findByTestId("SETTINGS.MESSAGE")).toHaveTextContent(
      L.reset.done,
      { exact: false },
    );
    expect(
      useOrdersStore.getState().orders.find((o) => o.id === "ORD-7846")?.status,
    ).toBe("NEW");
    expect(useRosterStore.getState().shifts.length).toBeGreaterThan(0);
  });

  it("signs out by clearing device data and preferences, then returns to the dashboard", async () => {
    usePreferencesStore.getState().setVibrateOnScanError(false);
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId("SETTINGS.SIGN_OUT"));
    expect(screen.getByText(L.signOut.confirmTitle)).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByTestId("CONFIRMATION_MODAL.CONFIRM_ACTION"),
    );

    expect(mockDismissTo).toHaveBeenCalledWith("/dashboard");
    expect(usePreferencesStore.getState().vibrateOnScanError).toBe(true);
  });

  it("does nothing if sign out is cancelled", async () => {
    await render(<SettingsScreen />);
    await fireEvent.press(screen.getByTestId("SETTINGS.SIGN_OUT"));
    await fireEvent.press(
      screen.getByTestId("CONFIRMATION_MODAL.CANCEL_ACTION"),
    );
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});
