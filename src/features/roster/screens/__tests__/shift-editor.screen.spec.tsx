import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { MockServer } from "@/services/mock-api/mock-server";

import { ShiftEditorScreen } from "@/features/roster/screens/shift-editor.screen";

import { createMockShifts } from "@/mocks/shifts";
import { DEMO_STORE_ID } from "@/mocks/store";

import { renderWithQuery } from "@test/render-with-query";
import { ROSTER_NOW, seedRoster } from "@test/roster-test-utils";

const L = LOCALE.roster.shiftEditor;
const V = LOCALE.roster.validation;

let mockParams: { date?: string; shiftId?: string; start?: string } = {};
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => true,
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));

/** The server's shifts, optionally for one person. */
const serverShifts = () => MockServer.getShifts(DEMO_STORE_ID);
const shiftsOf = async (employeeId: string) =>
  (await serverShifts()).filter((s) => s.employeeId === employeeId);

async function choose(field: string, value: string | number) {
  await fireEvent.press(screen.getByTestId(field));
  await fireEvent.press(screen.getByTestId(`${field}.OPTION.${value}`));
}

const MONDAY = "2026-10-05";
/** The Sunday before the demo week, so every day in it is still ahead. */
const EDITOR_NOW = new Date(2026, 9, 4, 8);

/** Renders the editor and waits for the roster and staff to load. */
async function renderEditor(now: Date = EDITOR_NOW) {
  await renderWithQuery(<ShiftEditorScreen now={now} />);
  await screen.findByTestId("SHIFT_EDITOR.SAVE_SHIFT");
}

async function openNew(date = "2026-10-07") {
  mockParams = { date };
  await renderEditor();
}

beforeEach(async () => {
  jest.clearAllMocks();
  // The demo week, with the server clock on the Sunday before so new shifts are not in the past.
  await seedRoster(EDITOR_NOW, createMockShifts(ROSTER_NOW));
});

describe("ShiftEditorScreen", () => {
  it("adds a valid shift", async () => {
    await openNew(MONDAY); // Tom Becker is free on Monday
    await choose("SHIFT_EDITOR.FIELD_EMPLOYEE", "emp-06");

    expect(screen.getByTestId("SHIFT_EDITOR.SUMMARY")).toHaveTextContent(
      L.summaryHours("8h", "7.5h"),
      { exact: false },
    );
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    expect(mockBack).toHaveBeenCalled();
    await waitFor(async () =>
      expect(
        (await shiftsOf("emp-06")).some(
          (s) => new Date(s.startAt).getDate() === 5,
        ),
      ).toBe(true),
    );
  });

  it("shows validation errors before saving when no employee is chosen", async () => {
    await openNew();
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    expect(
      await screen.findByTestId("SHIFT_EDITOR.FIELD_EMPLOYEE.ERROR"),
    ).toHaveTextContent(LOCALE.roster.shiftForm.chooseEmployee);
    expect(screen.getByTestId("SHIFT_EDITOR.FORM_ERRORS")).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("detects an overlapping shift", async () => {
    const before = (await serverShifts()).length;
    await openNew();
    await choose("SHIFT_EDITOR.FIELD_EMPLOYEE", "emp-03"); // Grace works 1pm–9pm on Wednesday
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    expect(
      await screen.findByTestId("SHIFT_EDITOR.FORM_ERRORS"),
    ).toHaveTextContent(
      V.alreadyWorks("Grace Liu", "1:00 pm – 9:00 pm", "Wed 7 Oct"),
      { exact: false },
    );
    expect(await serverShifts()).toHaveLength(before);
  });

  it('requires "Ends next day" for an overnight shift, then saves it', async () => {
    await openNew(MONDAY);
    await choose("SHIFT_EDITOR.FIELD_EMPLOYEE", "emp-06");
    await choose("SHIFT_EDITOR.FIELD_START", "22:00");
    await choose("SHIFT_EDITOR.FIELD_END", "06:00");
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    expect(
      await screen.findByTestId("SHIFT_EDITOR.FIELD_END_ERROR"),
    ).toHaveTextContent(V.endBeforeStart);

    await fireEvent(
      screen.getByTestId("SHIFT_EDITOR.FIELD_NEXT_DAY"),
      "valueChange",
      true,
    );
    expect(screen.getByTestId("SHIFT_EDITOR.SUMMARY")).toHaveTextContent(
      L.endsOn("Tue 6 Oct"),
      { exact: false },
    );
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    await waitFor(async () => {
      const overnight = (await shiftsOf("emp-06")).find(
        (s) => new Date(s.startAt).getDate() === 5,
      );
      expect(overnight && new Date(overnight.endAt).getDate()).toBe(6);
    });
  });

  it("rejects a break as long as the shift", async () => {
    await openNew(MONDAY);
    await choose("SHIFT_EDITOR.FIELD_EMPLOYEE", "emp-06");
    await choose("SHIFT_EDITOR.FIELD_START", "09:00");
    await choose("SHIFT_EDITOR.FIELD_END", "09:30");
    await choose("SHIFT_EDITOR.FIELD_BREAK", 30);
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    expect(
      await screen.findByTestId("SHIFT_EDITOR.FIELD_BREAK.ERROR"),
    ).toHaveTextContent(V.breakTooLong);
  });

  it("only offers active employees from this store", async () => {
    await openNew();
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.FIELD_EMPLOYEE"));

    expect(
      screen.getByTestId("SHIFT_EDITOR.FIELD_EMPLOYEE.OPTION.emp-01"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId("SHIFT_EDITOR.FIELD_EMPLOYEE.OPTION.emp-07"),
    ).not.toBeOnTheScreen(); // inactive
    expect(
      screen.queryByTestId("SHIFT_EDITOR.FIELD_EMPLOYEE.OPTION.emp-08"),
    ).not.toBeOnTheScreen(); // other store
  });

  it("edits and removes an existing shift", async () => {
    const [graceWednesday] = (await shiftsOf("emp-03")).filter(
      (s) => new Date(s.startAt).getDate() === 7,
    );
    if (!graceWednesday) {
      throw new Error("expected a mock shift");
    }
    mockParams = { shiftId: graceWednesday.id };
    await renderEditor();

    await choose("SHIFT_EDITOR.FIELD_END", "18:00");
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));
    await waitFor(async () => {
      const saved = (await serverShifts()).find(
        (s) => s.id === graceWednesday.id,
      );
      expect(saved && new Date(saved.endAt).getHours()).toBe(18);
    });

    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.DELETE_SHIFT"));
    await fireEvent.press(
      screen.getByTestId("CONFIRMATION_MODAL.CONFIRM_ACTION"),
    );
    await waitFor(async () =>
      expect(
        (await serverShifts()).find((s) => s.id === graceWednesday.id),
      ).toBeUndefined(),
    );
  });

  it("pre-fills a cover shift from the floor cover chart's start hour", async () => {
    mockParams = { date: MONDAY, start: "17" };
    await renderEditor();

    expect(screen.getByTestId("SHIFT_EDITOR.SUMMARY")).toHaveTextContent(
      /4h shift · 4h paid/,
    );
    await choose("SHIFT_EDITOR.FIELD_EMPLOYEE", "emp-06");
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    await waitFor(async () => {
      const added = (await shiftsOf("emp-06")).find(
        (s) => new Date(s.startAt).getDate() === 5,
      );
      expect(added && new Date(added.startAt).getHours()).toBe(17);
      expect(added && new Date(added.endAt).getHours()).toBe(21);
      expect(added?.unpaidBreakMinutes).toBe(0);
    });
  });

  it("shows the date from the roster instead of a date picker", async () => {
    await openNew(MONDAY);

    expect(screen.getByTestId("SHIFT_EDITOR.DATE")).toHaveTextContent(
      /Mon 5 Oct/,
    );
    expect(
      screen.queryByTestId(/^SHIFT_EDITOR\.FIELD_DATE/),
    ).not.toBeOnTheScreen();
  });

  it("refuses a new shift that would start in the past", async () => {
    mockParams = { date: "2026-10-07", start: "9" };
    await renderEditor(new Date(2026, 9, 7, 12));
    await choose("SHIFT_EDITOR.FIELD_EMPLOYEE", "emp-06");
    await fireEvent.press(screen.getByTestId("SHIFT_EDITOR.SAVE_SHIFT"));

    expect(
      await screen.findByText(LOCALE.roster.validation.startsInPast),
    ).toBeOnTheScreen();
  });

  it("starts a shift added later today at the next full hour", async () => {
    mockParams = { date: "2026-10-07" };
    await renderEditor(new Date(2026, 9, 7, 13, 20));

    expect(screen.getByTestId("SHIFT_EDITOR.SUMMARY")).toHaveTextContent(
      /7h shift · 6\.5h paid/,
    );
  });
});
