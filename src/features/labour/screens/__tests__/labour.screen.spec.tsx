import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { FormatUtils } from "@/utils/format-utils";

import { LabourUtils } from "@/features/labour/domain/labour";
import { LabourScreen } from "@/features/labour/screens/labour.screen";
import { DateUtils } from "@/features/roster/domain/dates";
import { useRosterStore } from "@/features/roster/store/roster.store";

import {
  MOCK_PAY_RATES,
  WEEKLY_LABOUR_BUDGET,
  WEEKLY_SALES_FORECAST,
} from "@/mocks/pay-rates";

import { resetRosterStore, ROSTER_NOW } from "@test/roster-test-utils";
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

const expectedSummary = () =>
  LabourUtils.weeklyLabourSummary({
    weekStart: DateUtils.startOfWeek(ROSTER_NOW),
    shifts: useRosterStore.getState().shifts,
    employees: useRosterStore.getState().employees,
    rates: MOCK_PAY_RATES,
    budget: WEEKLY_LABOUR_BUDGET,
    salesForecastByWeekday: WEEKLY_SALES_FORECAST,
  });

beforeEach(() => {
  jest.clearAllMocks();
  resetRosterStore();
  signInAs("manager");
});

describe("LabourScreen", () => {
  it("shows the weekly estimate, budget and labour percentage with a clear disclaimer", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);
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
    await render(<LabourScreen now={ROSTER_NOW} />);

    expect(screen.getByLabelText(/^Sun 11 Oct: \$\d/)).toBeOnTheScreen();
    // Alex: 6 shifts × 8 paid hours × $38.50
    expect(
      screen.getByLabelText(
        L.employeeA11y("Alex Morgan", "$1,848.00", "48h", 6),
      ),
    ).toBeOnTheScreen();
  });

  it("recalculates immediately when the roster changes", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);
    const before = expectedSummary().totalCost;
    const [first] = useRosterStore.getState().shifts;

    await act(async () => {
      useRosterStore.getState().removeShift(first!.id);
    });

    const after = expectedSummary().totalCost;
    expect(after).toBeLessThan(before);
    expect(screen.getByTestId("LABOUR.COST.VALUE")).toHaveTextContent(
      FormatUtils.formatCurrency(after),
    );
  });

  it("shows an empty week without dividing by zero", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);
    await fireEvent.press(screen.getByTestId("WEEK_NAVIGATOR.NEXT_WEEK"));

    expect(screen.getByTestId("LABOUR.COST.VALUE")).toHaveTextContent("$0");
    expect(screen.getByText(L.noShifts)).toBeOnTheScreen();
  });

  it("links to the roster to adjust shifts", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);
    await fireEvent.press(screen.getByTestId("LABOUR.ADJUST_SHIFTS"));
    expect(mockNavigate).toHaveBeenCalledWith("/roster");
  });

  it("hides pay information from team members", async () => {
    signInAs("shiftLeader");
    await render(<LabourScreen now={ROSTER_NOW} />);

    expect(screen.getByText(LOCALE.labour.restricted.title)).toBeOnTheScreen();
    expect(screen.queryByTestId("LABOUR.COST")).not.toBeOnTheScreen();
    expect(screen.queryByText(/Alex Morgan/)).not.toBeOnTheScreen();
  });
});
