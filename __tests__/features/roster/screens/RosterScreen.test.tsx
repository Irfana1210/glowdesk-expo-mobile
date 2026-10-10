import { fireEvent, render, screen } from '@testing-library/react-native';

import { formatHours, totalPaidMinutes } from '@/features/roster/domain/shifts';
import { createMockShifts } from '@/mocks/shifts';
import { ROSTER_NOW, resetRosterStore } from '@test/rosterTestUtils';

import { RosterScreen } from '@/features/roster/screens/RosterScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
  jest.clearAllMocks();
  resetRosterStore();
});

describe('RosterScreen', () => {
  it('shows the current week, its total hours and today', async () => {
    await render(<RosterScreen now={ROSTER_NOW} />);

    expect(screen.getByTestId('week-range')).toHaveTextContent('5 – 11 Oct 2026');
    expect(screen.getByText(`${formatHours(totalPaidMinutes(createMockShifts(ROSTER_NOW)))} scheduled this week`)).toBeOnTheScreen();
    expect(screen.getByTestId('day-2026-10-07')).toBeSelected();
  });

  it("lists the selected day's shifts with staff count, paid hours and coverage", async () => {
    await render(<RosterScreen now={ROSTER_NOW} />);

    expect(screen.getByTestId('day-totals')).toHaveTextContent('6 staff · 37.5h paid');
    expect(screen.getByTestId('coverage')).toHaveTextContent(/Covered for all trading hours, 9:00 am – 9:00 pm/);
    expect(screen.getByLabelText(/^Jordan Lee, Shift Runner, 12:00 pm – 8:30 pm, 8h paid, 30m break$/)).toBeOnTheScreen();
  });

  it('flags a coverage gap', async () => {
    await render(<RosterScreen now={ROSTER_NOW} />);

    expect(screen.getByLabelText('Sun 11 Oct, 2 staff, coverage gap')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('day-2026-10-11'));
    expect(screen.getByTestId('coverage')).toHaveTextContent(/No one rostered 5:00 pm – 9:00 pm\./);
  });

  it('marks overnight shifts', async () => {
    await render(<RosterScreen now={ROSTER_NOW} />);
    await fireEvent.press(screen.getByTestId('day-2026-10-08'));

    expect(screen.getByLabelText(/Tom Becker, Stock Associate, 10:00 pm – 6:00 am, overnight, ends Fri 9 Oct/)).toBeOnTheScreen();
  });

  it('navigates weeks and shows an empty day', async () => {
    await render(<RosterScreen now={ROSTER_NOW} />);

    await fireEvent.press(screen.getByTestId('next-week'));
    expect(screen.getByTestId('week-range')).toHaveTextContent('12 – 18 Oct 2026');
    expect(screen.getByText('No shifts')).toBeOnTheScreen();
    expect(screen.getByText('0h scheduled this week')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Back to this week' }));
    expect(screen.getByTestId('week-range')).toHaveTextContent('5 – 11 Oct 2026');
  });

  it('opens the editor to add or edit a shift', async () => {
    await render(<RosterScreen now={ROSTER_NOW} />);

    await fireEvent.press(screen.getByTestId('add-shift'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/roster/shift', params: { date: '2026-10-07' } });

    await fireEvent.press(screen.getAllByTestId(/^shift-card-/)[0]!);
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/roster/shift', params: { shiftId: expect.any(String) } });
  });
});
