import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { ShiftUtils } from "@/features/roster/domain/shifts";
import { RosterScreen } from "@/features/roster/screens/roster.screen";

import { createMockShifts } from "@/mocks/shifts";

import { renderWithQuery } from "@test/render-with-query";
import { seedRoster } from "@test/roster-test-utils";
import { signInAs } from "@test/session-test-utils";

const L = LOCALE.roster.roster;
const ROW = LOCALE.roster.rosterRow;
const COVER = LOCALE.roster.cover;
const FLOOR = LOCALE.roster.floorCover;

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

/** Saturday 10 October 2026, 4:40 pm: the moment the Roster mockup shows. */
const NOW = new Date(2026, 9, 10, 16, 40);

beforeEach(async () => {
  jest.clearAllMocks();
  signInAs("manager");
  await seedRoster(NOW);
});

/** Renders the roster and waits for the shifts to load from the mock server. */
async function renderRoster(now: Date) {
  await renderWithQuery(<RosterScreen now={now} />);
  await waitFor(() =>
    expect(
      screen.queryByText(LOCALE.roster.roster.loading),
    ).not.toBeOnTheScreen(),
  );
}

describe("RosterScreen", () => {
  it("shows the week, selects today and totals the week", async () => {
    await renderRoster(NOW);

    expect(screen.getByTestId("ROSTER.WEEK_RANGE")).toHaveTextContent(
      "5 – 11 Oct",
    );
    expect(
      screen.getByTestId("WEEK_DAY_SELECTOR.DAY.2026-10-10"),
    ).toBeSelected();
    expect(
      screen.getByLabelText(
        LOCALE.roster.weekDaySelector.day("Sat 10 Oct", true),
      ),
    ).toBeOnTheScreen();
    // The designed Saturday plus the weekday pattern: 191.5 paid hours.
    expect(screen.getByTestId("ROSTER.WEEK_TOTAL")).toHaveTextContent(
      L.weekTotal("191.5 h"),
    );
  });

  it("shows floor cover for today like the mockup", async () => {
    await renderRoster(NOW);

    expect(screen.getByTestId("ROSTER.DAY_TOTALS")).toHaveTextContent(
      L.dayTotals(6, "37.5 h"),
    );
    expect(
      screen.getByTestId("FLOOR_COVER_CHART.COVER.11.2.LOW"),
    ).toBeOnTheScreen();
    expect(
      screen.getByTestId("FLOOR_COVER_CHART.COVER.13.4"),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("FLOOR_COVER_CHART.NOTE")).toHaveTextContent(
      FLOOR.belowMinimumNote(3, "11 am"),
    );
    expect(screen.getByLabelText(FLOOR.hourLabel("1 pm", 4))).toBeOnTheScreen();
  });

  it("does not offer cover for a gap that is already over", async () => {
    await renderRoster(NOW);

    // At 4:40 pm the 11 am gap has passed, so it is information, not a button.
    expect(
      screen.queryByRole("button", { name: /below the minimum/ }),
    ).not.toBeOnTheScreen();
    expect(
      screen.queryByTestId("FLOOR_COVER_CHART.ADD_COVER"),
    ).not.toBeOnTheScreen();
  });

  it("opens Add shift at a low hour from the bar or the note button", async () => {
    await renderRoster(NOW);
    await fireEvent.press(
      screen.getByTestId("WEEK_DAY_SELECTOR.DAY.2026-10-11"),
    );

    const addCover = screen.getByTestId("FLOOR_COVER_CHART.ADD_COVER");
    expect(addCover).toHaveTextContent(/Add cover at 9 am/);
    await fireEvent.press(addCover);
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/roster/shift",
      params: { date: "2026-10-11", start: "9" },
    });

    await fireEvent.press(
      screen.getByRole("button", { name: FLOOR.hourLabelLow("5 pm", 0, 3) }),
    );
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/roster/shift",
      params: { date: "2026-10-11", start: "17" },
    });
  });

  it("offers today's gap while it is still ahead", async () => {
    await renderRoster(new Date(2026, 9, 10, 10, 15));

    expect(screen.getByTestId("FLOOR_COVER_CHART.ADD_COVER")).toHaveTextContent(
      /Add cover at 11 am/,
    );
  });

  it("lists today's shifts working first with live states", async () => {
    await renderRoster(NOW);

    const rows = screen
      .getAllByTestId(/^ROSTER\.SHIFT_ROW\./)
      .map((n) => n.props.testID as string)
      .filter((id) => !id.endsWith(".EDIT"));
    expect(rows).toHaveLength(6);
    expect(
      screen.getByLabelText(
        [
          "Alex Morgan",
          "Store Manager · Full time",
          "9:00 am – 5:30 pm",
          `${ROW.breakMinutes(30)} · 8h`,
          COVER.onTheFloorYou,
        ].join(", "),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        [
          "Grace Liu",
          "Beauty Advisor · Casual",
          "1:00 – 9:00 pm",
          `${ROW.breakMinutes(30)} · 7.5h`,
          COVER.onTheFloor,
        ].join(", "),
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        [
          "Tom Becker",
          "Stock Associate · Part time",
          "7:00 – 11:00 am",
          `${ROW.noBreak} · 4h`,
          COVER.finished,
        ].join(", "),
      ),
    ).toBeOnTheScreen();
    expect(rows.indexOf("ROSTER.SHIFT_ROW." + todayShiftId("emp-06"))).toBe(5);
  });

  it("shows another day without live states and flags its cover", async () => {
    await renderRoster(NOW);
    await fireEvent.press(
      screen.getByTestId("WEEK_DAY_SELECTOR.DAY.2026-10-11"),
    );

    expect(
      screen.queryByText(COVER.onTheFloor, { exact: false }),
    ).not.toBeOnTheScreen();
    expect(screen.getByTestId("FLOOR_COVER_CHART.NOTE")).toHaveTextContent(
      FLOOR.belowMinimumNote(3, ""),
      { exact: false },
    );
    expect(
      screen.getByLabelText(
        /^Jordan Lee, Shift Leader · Full time, 9:00 am – 5:00 pm/,
      ),
    ).toBeOnTheScreen();
  });

  it("marks overnight shifts", async () => {
    await renderRoster(NOW);
    await fireEvent.press(
      screen.getByTestId("WEEK_DAY_SELECTOR.DAY.2026-10-08"),
    );

    expect(
      screen.getByLabelText(
        [
          "Tom Becker",
          "Stock Associate · Part time",
          "10:00 pm – 6:00 am",
          ROW.overnightEnds("Fri 9 Oct"),
        ].join(", "),
        { exact: false },
      ),
    ).toBeOnTheScreen();
  });

  it("navigates weeks, shows an empty day and returns to this week", async () => {
    await renderRoster(NOW);

    await fireEvent.press(screen.getByTestId("ROSTER.NEXT_WEEK"));
    expect(screen.getByTestId("ROSTER.WEEK_RANGE")).toHaveTextContent(
      /^12 – 18 Oct/,
    );
    expect(screen.getByText(L.thisWeek)).toBeOnTheScreen();
    expect(screen.getByText(L.noShiftsTitle)).toBeOnTheScreen();
    expect(screen.getByTestId("ROSTER.WEEK_TOTAL")).toHaveTextContent(
      L.weekTotal("0 h"),
    );

    await fireEvent.press(screen.getByTestId("ROSTER.WEEK_RANGE"));
    expect(screen.getByTestId("ROSTER.WEEK_RANGE")).toHaveTextContent(
      "5 – 11 Oct",
    );
    expect(
      screen.getByTestId("WEEK_DAY_SELECTOR.DAY.2026-10-10"),
    ).toBeSelected();
  });

  it("opens the editor to add or edit a shift", async () => {
    await renderRoster(NOW);

    await fireEvent.press(screen.getByTestId("ROSTER.ADD_SHIFT"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/roster/shift",
      params: { date: "2026-10-10" },
    });

    await fireEvent.press(
      screen.getByRole("button", { name: "Edit shift for Grace Liu" }),
    );
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: "/roster/shift",
      params: { shiftId: expect.any(String) },
    });
  });

  it("disables Add shift on a past day and says why", async () => {
    await renderRoster(NOW);
    expect(screen.getByTestId("ROSTER.ADD_SHIFT")).toBeEnabled();

    await fireEvent.press(
      screen.getByTestId("WEEK_DAY_SELECTOR.DAY.2026-10-09"),
    );

    expect(screen.getByTestId("ROSTER.ADD_SHIFT")).toBeDisabled();
    expect(screen.getByTestId("ROSTER.PAST_DAY_NOTE")).toHaveTextContent(
      L.addShiftPastDay,
    );
  });
});

function todayShiftId(employeeId: string): string {
  const shift = ShiftUtils.shiftsOnDay(createMockShifts(NOW), NOW).find(
    (s) => s.employeeId === employeeId,
  );
  if (!shift) {
    throw new Error(`no shift today for ${employeeId}`);
  }
  return shift.id;
}
