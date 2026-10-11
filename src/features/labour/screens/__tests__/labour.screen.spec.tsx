import { type QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { SHIFTS_CACHE_KEY } from "@/services/cache-keys";

import { LabourUtils } from "@/features/labour/domain/labour";
import { LabourScreen } from "@/features/labour/screens/labour.screen";
import { DateUtils } from "@/features/roster/domain/dates";
import { type Shift } from "@/features/roster/types";

import { MOCK_EMPLOYEES } from "@/mocks/employees";
import {
  MOCK_PAY_RATES,
  WEEKLY_LABOUR_BUDGET,
  WEEKLY_SALES_FORECAST,
} from "@/mocks/pay-rates";
import { createMockShifts } from "@/mocks/shifts";
import { DEMO_STORE_ID } from "@/mocks/store";

import { renderWithQuery } from "@test/render-with-query";
import { ROSTER_NOW, seedRoster } from "@test/roster-test-utils";
import { signInAs } from "@test/session-test-utils";

const L = LOCALE.labour.labour;

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    back: jest.fn(),
    canGoBack: () => true,
    replace: jest.fn(),
  }),
}));

const SHIFTS_KEY = [SHIFTS_CACHE_KEY, DEMO_STORE_ID];
let client: QueryClient;

const expectedSummary = (shifts: Array<Shift> = createMockShifts(ROSTER_NOW)) =>
  LabourUtils.weeklyLabourSummary({
    weekStart: DateUtils.startOfWeek(ROSTER_NOW),
    shifts,
    employees: MOCK_EMPLOYEES,
    rates: MOCK_PAY_RATES,
    budget: WEEKLY_LABOUR_BUDGET,
    salesForecastByWeekday: WEEKLY_SALES_FORECAST,
  });

/** Renders the screen and waits for the roster, staff and pay rates to load. */
async function renderLabour() {
  ({ client } = await renderWithQuery(<LabourScreen now={ROSTER_NOW} />));
  await screen.findByTestId("LABOUR.SCREEN");
  if (!screen.queryByText(LOCALE.labour.restricted.title)) {
    await screen.findByTestId("LABOUR.COST.VALUE");
  }
}

beforeEach(async () => {
  jest.clearAllMocks();
  await seedRoster();
  signInAs("manager");
});

describe("LabourScreen", () => {
  it("shows the weekly estimate, budget and labour percentage with a clear disclaimer", async () => {
    await renderLabour();
    const summary = expectedSummary();

    expect(screen.getByTestId("LABOUR.COST.VALUE")).toHaveTextContent(
      FormatUtils.formatCurrency(summary.totalCost),
    );
    expect(screen.getByText(L.paid("202.5h"))).toBeOnTheScreen();
    expect(
      screen.getByText(
        L.budgetRemaining(FormatUtils.formatCurrency(summary.budgetRemaining)),
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("LABOUR.DISCLAIMER")).toHaveTextContent(
      L.disclaimer,
      { exact: false },
    );
  });

  it("breaks cost down by day and by employee", async () => {
    await renderLabour();

    expect(screen.getByLabelText(/^Sun 11 Oct: \$\d/)).toBeOnTheScreen();
    // Alex: 6 shifts × 8 paid hours × $38.50
    expect(
      screen.getByLabelText(
        L.employeeA11y("Alex Morgan", "$1,848.00", "48h", 6),
      ),
    ).toBeOnTheScreen();
  });

  it("recalculates immediately when the roster changes", async () => {
    await renderLabour();
    const shifts = client.getQueryData<Array<Shift>>(SHIFTS_KEY) ?? [];
    const before = expectedSummary(shifts).totalCost;
    const remaining = shifts.slice(1);

    // Any change to the cached roster, such as an edit on the Roster tab, recalculates the costs.
    await act(async () => {
      client.setQueryData(SHIFTS_KEY, remaining);
    });

    const after = expectedSummary(remaining).totalCost;
    expect(after).toBeLessThan(before);
    await waitFor(() =>
      expect(screen.getByTestId("LABOUR.COST.VALUE")).toHaveTextContent(
        FormatUtils.formatCurrency(after),
      ),
    );
  });

  it("shows an empty week without dividing by zero", async () => {
    await renderLabour();
    await fireEvent.press(screen.getByTestId("WEEK_NAVIGATOR.NEXT_WEEK"));

    expect(screen.getByTestId("LABOUR.COST.VALUE")).toHaveTextContent("$0");
    expect(screen.getByText(L.noShifts)).toBeOnTheScreen();
  });

  it("links to the roster to adjust shifts", async () => {
    await renderLabour();
    await fireEvent.press(screen.getByTestId("LABOUR.ADJUST_SHIFTS"));
    expect(mockNavigate).toHaveBeenCalledWith("/roster");
  });

  it("hides pay information from team members", async () => {
    signInAs("shiftLeader");
    await renderLabour();

    expect(screen.getByText(LOCALE.labour.restricted.title)).toBeOnTheScreen();
    expect(screen.queryByTestId("LABOUR.COST")).not.toBeOnTheScreen();
    expect(screen.queryByText(/Alex Morgan/)).not.toBeOnTheScreen();
  });
});
