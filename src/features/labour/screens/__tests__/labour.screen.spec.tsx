import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { FormatUtils } from "@/utils/format-utils";

import { LabourUtils } from "@/features/labour/domain/labour";
import { LabourScreen } from "@/features/labour/screens/labour.screen";
import { DateUtils } from "@/features/roster/domain/dates";
import { useRosterStore } from "@/features/roster/store/roster.store";
import { useSessionStore } from "@/features/session/session.store";

import {
  MOCK_PAY_RATES,
  WEEKLY_LABOUR_BUDGET,
  WEEKLY_SALES_FORECAST,
} from "@/mocks/pay-rates";

import { resetRosterStore, ROSTER_NOW } from "@test/roster-test-utils";

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
  useSessionStore.setState({ role: "MANAGER" });
});

describe("LabourScreen", () => {
  it("shows the weekly estimate, budget and labour percentage with a clear disclaimer", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);
    const summary = expectedSummary();

    expect(screen.getByTestId("labour-cost-value")).toHaveTextContent(
      FormatUtils.formatCurrency(summary.totalCost),
    );
    expect(screen.getByText("202.5h paid")).toBeOnTheScreen();
    expect(
      screen.getByText(
        `${FormatUtils.formatCurrency(summary.budgetRemaining)} remaining`,
      ),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("labour-disclaimer")).toHaveTextContent(
      /Not a payroll calculation/,
    );
  });

  it("breaks cost down by day and by employee", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);

    expect(screen.getByLabelText(/^Sun 11 Oct: \$\d/)).toBeOnTheScreen();
    // Alex: 6 shifts × 8 paid hours × $38.50
    expect(
      screen.getByLabelText("Alex Morgan: $1,848.00, 48h over 6 shifts"),
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
    expect(screen.getByTestId("labour-cost-value")).toHaveTextContent(
      FormatUtils.formatCurrency(after),
    );
  });

  it("shows an empty week without dividing by zero", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);
    await fireEvent.press(screen.getByTestId("next-week"));

    expect(screen.getByTestId("labour-cost-value")).toHaveTextContent("$0");
    expect(screen.getByText("No shifts rostered this week.")).toBeOnTheScreen();
  });

  it("links to the roster to adjust shifts", async () => {
    await render(<LabourScreen now={ROSTER_NOW} />);
    await fireEvent.press(screen.getByTestId("adjust-shifts"));
    expect(mockNavigate).toHaveBeenCalledWith("/roster");
  });

  it("hides pay information from team members", async () => {
    useSessionStore.setState({ role: "TEAM_MEMBER" });
    await render(<LabourScreen now={ROSTER_NOW} />);

    expect(screen.getByText("Managers only")).toBeOnTheScreen();
    expect(screen.queryByTestId("labour-cost")).not.toBeOnTheScreen();
    expect(screen.queryByText(/Alex Morgan/)).not.toBeOnTheScreen();
  });
});
