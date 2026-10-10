import { fireEvent, render, screen } from '@testing-library/react-native';

import { shiftsOnDay } from '@/features/roster/domain/shifts';
import { RosterScreen } from '@/features/roster/screens/RosterScreen';
import { createMockShifts } from '@/mocks/shifts';
import { resetRosterStore } from '@test/rosterTestUtils';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

/** Saturday 10 October 2026, 4:40 pm: the moment the Roster mockup shows. */
const NOW = new Date(2026, 9, 10, 16, 40);

beforeEach(() => {
  jest.clearAllMocks();
  resetRosterStore(NOW);
});

describe('RosterScreen', () => {
  it('shows the week, selects today and totals the week', async () => {
    await render(<RosterScreen now={NOW} />);

    expect(screen.getByTestId('week-range')).toHaveTextContent('5 – 11 Oct');
    expect(screen.getByTestId('day-2026-10-10')).toBeSelected();
    expect(screen.getByLabelText('Sat 10 Oct, today')).toBeOnTheScreen();
    // The designed Saturday plus the weekday pattern: 191.5 paid hours.
    expect(screen.getByTestId('week-total')).toHaveTextContent(/191\.5 h scheduled this week/);
  });

  it('shows floor cover for today like the mockup', async () => {
    await render(<RosterScreen now={NOW} />);

    expect(screen.getByTestId('day-totals')).toHaveTextContent('6 staff · 37.5 h');
    expect(screen.getByTestId('cover-11-2-low')).toBeOnTheScreen();
    expect(screen.getByTestId('cover-13-4')).toBeOnTheScreen();
    expect(screen.getByTestId('cover-note')).toHaveTextContent('Below minimum of 3 at 11 am');
    expect(
      screen.getByRole('image', {
        name: 'Staff on the floor by hour, 9 am to 8 pm. Lowest is 2 people at 11 am, below the minimum of 3.',
      }),
    ).toBeOnTheScreen();
  });

  it("lists today's shifts working first with live states", async () => {
    await render(<RosterScreen now={NOW} />);

    const rows = screen
      .getAllByTestId(/^shift-row-/)
      .map((n) => n.props.testID as string)
      .filter((id) => !id.endsWith('-edit'));
    expect(rows).toHaveLength(6);
    expect(screen.getByLabelText(/^Alex Morgan, Store Manager · Full time, 9:00 am – 5:30 pm, 30m break · 8h, On the floor \(you\)$/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Grace Liu, Beauty Advisor · Casual, 1:00 – 9:00 pm, 30m break · 7\.5h, Break at 5:00 pm · needs cover$/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Tom Becker, Stock Associate · Part time, 7:00 – 11:00 am, No break · 4h, Finished$/)).toBeOnTheScreen();
    expect(rows.indexOf('shift-row-' + todayShiftId('emp-06'))).toBe(5);
  });

  it('shows another day without live states and flags its cover', async () => {
    await render(<RosterScreen now={NOW} />);
    await fireEvent.press(screen.getByTestId('day-2026-10-11'));

    expect(screen.queryByText(/On the floor/)).not.toBeOnTheScreen();
    expect(screen.getByTestId('cover-note')).toHaveTextContent(/Below minimum of 3 at/);
    expect(screen.getByLabelText(/^Jordan Lee, Shift Runner · Full time, 9:00 am – 5:00 pm/)).toBeOnTheScreen();
  });

  it('marks overnight shifts', async () => {
    await render(<RosterScreen now={NOW} />);
    await fireEvent.press(screen.getByTestId('day-2026-10-08'));

    expect(screen.getByLabelText(/Tom Becker, Stock Associate · Part time, 10:00 pm – 6:00 am, overnight, ends Fri 9 Oct/)).toBeOnTheScreen();
  });

  it('navigates weeks, shows an empty day and returns to this week', async () => {
    await render(<RosterScreen now={NOW} />);

    await fireEvent.press(screen.getByTestId('next-week'));
    expect(screen.getByTestId('week-range')).toHaveTextContent(/^12 – 18 Oct/);
    expect(screen.getByText('This week')).toBeOnTheScreen();
    expect(screen.getByText('No shifts')).toBeOnTheScreen();
    expect(screen.getByTestId('week-total')).toHaveTextContent(/0 h scheduled this week/);

    await fireEvent.press(screen.getByTestId('week-range'));
    expect(screen.getByTestId('week-range')).toHaveTextContent('5 – 11 Oct');
    expect(screen.getByTestId('day-2026-10-10')).toBeSelected();
  });

  it('opens the editor to add or edit a shift', async () => {
    await render(<RosterScreen now={NOW} />);

    await fireEvent.press(screen.getByTestId('add-shift'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/roster/shift', params: { date: '2026-10-10' } });

    await fireEvent.press(screen.getByRole('button', { name: 'Edit shift for Grace Liu' }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/roster/shift', params: { shiftId: expect.any(String) } });
  });
});

function todayShiftId(employeeId: string): string {
  const shift = shiftsOnDay(createMockShifts(NOW), NOW).find((s) => s.employeeId === employeeId);
  if (!shift) throw new Error(`no shift today for ${employeeId}`);
  return shift.id;
}
