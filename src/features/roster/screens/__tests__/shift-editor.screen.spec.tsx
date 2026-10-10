import { fireEvent, render, screen } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { ShiftEditorScreen } from "@/features/roster/screens/shift-editor.screen";
import { useRosterStore } from "@/features/roster/store/roster.store";

import { resetRosterStore } from "@test/roster-test-utils";

const L = LOCALE.roster.shiftEditor;
const V = LOCALE.roster.validation;

let mockParams: { date?: string; shiftId?: string } = {};
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => true,
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));

const shiftsOf = (employeeId: string) =>
  useRosterStore.getState().shifts.filter((s) => s.employeeId === employeeId);

async function choose(field: string, value: string | number) {
  await fireEvent.press(screen.getByTestId(field));
  await fireEvent.press(screen.getByTestId(`${field}-option-${value}`));
}

const MONDAY = "2026-10-05";

async function openNew(date = "2026-10-07") {
  mockParams = { date };
  await render(<ShiftEditorScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  resetRosterStore();
});

describe("ShiftEditorScreen", () => {
  it("adds a valid shift", async () => {
    await openNew(MONDAY); // Tom Becker is free on Monday
    await choose("field-employee", "emp-06");

    expect(screen.getByTestId("shift-summary")).toHaveTextContent(
      L.summaryHours("8h", "7.5h"),
      { exact: false },
    );
    await fireEvent.press(screen.getByTestId("save-shift"));

    expect(
      shiftsOf("emp-06").some((s) => new Date(s.startAt).getDate() === 5),
    ).toBe(true);
    expect(mockBack).toHaveBeenCalled();
  });

  it("shows validation errors before saving when no employee is chosen", async () => {
    await openNew();
    await fireEvent.press(screen.getByTestId("save-shift"));

    expect(await screen.findByTestId("field-employee-error")).toHaveTextContent(
      LOCALE.roster.shiftForm.chooseEmployee,
    );
    expect(screen.getByTestId("form-errors")).toBeOnTheScreen();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("detects an overlapping shift", async () => {
    const before = useRosterStore.getState().shifts.length;
    await openNew();
    await choose("field-employee", "emp-03"); // Grace works 1pm–9pm on Wednesday
    await fireEvent.press(screen.getByTestId("save-shift"));

    expect(await screen.findByTestId("form-errors")).toHaveTextContent(
      V.alreadyWorks("Grace Liu", "1:00 pm – 9:00 pm", "Wed 7 Oct"),
      { exact: false },
    );
    expect(useRosterStore.getState().shifts).toHaveLength(before);
  });

  it('requires "Ends next day" for an overnight shift, then saves it', async () => {
    await openNew(MONDAY);
    await choose("field-employee", "emp-06");
    await choose("field-start", "22:00");
    await choose("field-end", "06:00");
    await fireEvent.press(screen.getByTestId("save-shift"));

    expect(await screen.findByTestId("field-end-error")).toHaveTextContent(
      V.endBeforeStart,
    );

    await fireEvent(screen.getByTestId("field-next-day"), "valueChange", true);
    expect(screen.getByTestId("shift-summary")).toHaveTextContent(
      L.endsOn("Tue 6 Oct"),
      { exact: false },
    );
    await fireEvent.press(screen.getByTestId("save-shift"));

    const overnight = shiftsOf("emp-06").find(
      (s) => new Date(s.startAt).getDate() === 5,
    );
    expect(overnight && new Date(overnight.endAt).getDate()).toBe(6);
  });

  it("rejects a break as long as the shift", async () => {
    await openNew(MONDAY);
    await choose("field-employee", "emp-06");
    await choose("field-start", "09:00");
    await choose("field-end", "09:30");
    await choose("field-break", 30);
    await fireEvent.press(screen.getByTestId("save-shift"));

    expect(await screen.findByTestId("field-break-error")).toHaveTextContent(
      V.breakTooLong,
    );
  });

  it("only offers active employees from this store", async () => {
    await openNew();
    await fireEvent.press(screen.getByTestId("field-employee"));

    expect(
      screen.getByTestId("field-employee-option-emp-01"),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId("field-employee-option-emp-07"),
    ).not.toBeOnTheScreen(); // inactive
    expect(
      screen.queryByTestId("field-employee-option-emp-08"),
    ).not.toBeOnTheScreen(); // other store
  });

  it("edits and removes an existing shift", async () => {
    const [graceWednesday] = shiftsOf("emp-03").filter(
      (s) => new Date(s.startAt).getDate() === 7,
    );
    if (!graceWednesday) {
      throw new Error("expected a mock shift");
    }
    mockParams = { shiftId: graceWednesday.id };
    await render(<ShiftEditorScreen />);

    await choose("field-end", "18:00");
    await fireEvent.press(screen.getByTestId("save-shift"));
    expect(
      new Date(
        useRosterStore
          .getState()
          .shifts.find((s) => s.id === graceWednesday.id)!.endAt,
      ).getHours(),
    ).toBe(18);

    await fireEvent.press(screen.getByTestId("delete-shift"));
    await fireEvent.press(screen.getByTestId("confirm-action"));
    expect(
      useRosterStore.getState().shifts.find((s) => s.id === graceWednesday.id),
    ).toBeUndefined();
  });
});
