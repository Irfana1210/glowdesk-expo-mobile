import { fireEvent, render, screen } from '@testing-library/react-native';

import { AttentionItem } from '@/components/ui/AttentionItem';
import { FilterChips } from '@/components/ui/FilterChips';
import { IconButton } from '@/components/ui/IconButton';
import { OrderCard } from '@/components/ui/OrderCard';
import { ProductRow } from '@/components/ui/ProductRow';
import { monogram } from '@/components/ui/ProductThumbnail';
import { ScreenTitle } from '@/components/ui/ScreenTitle';
import { ShiftCard } from '@/components/ui/ShiftCard';
import { ShiftRow } from '@/components/ui/ShiftRow';
import { StatusBadge } from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('always shows the status as text with a spoken label', async () => {
    await render(<StatusBadge label="Low stock" icon="alert-circle-outline" tone="lowStock" />);
    expect(screen.getByLabelText('Status: Low stock')).toHaveTextContent(/Low stock/);
  });
});

describe('FilterChips', () => {
  it('marks the selected chip and reports changes', async () => {
    const onChange = jest.fn();
    await render(
      <FilterChips
        options={[
          { value: 'ALL', label: 'All', count: 17 },
          { value: 'NEW', label: 'New', count: 7 },
        ]}
        selected="ALL"
        onChange={onChange}
        accessibilityLabel="Filter"
      />,
    );
    expect(screen.getByTestId('filter-ALL')).toBeSelected();
    expect(screen.getByTestId('filter-NEW')).not.toBeSelected();
    await fireEvent.press(screen.getByTestId('filter-NEW'));
    expect(onChange).toHaveBeenCalledWith('NEW');
  });
});

describe('OrderCard', () => {
  it('shows the order, assignee and timing, and opens on press', async () => {
    const onPress = jest.fn();
    await render(
      <OrderCard
        testID="card"
        orderNumber="7841"
        initials="J.L."
        summary="5 items · placed 1:47 pm"
        status={{ label: 'Picking', icon: 'basket-outline', tone: 'picking' }}
        assigneeLabel="Jordan Lee"
        timingLabel="Overdue 53 min"
        overdue
        onPress={onPress}
        accessibilityLabel="Order 7841, Picking, Overdue 53 min, Jordan Lee"
      />,
    );
    expect(screen.getByText('#ORD-7841')).toBeOnTheScreen();
    expect(screen.getByText('Overdue 53 min')).toBeOnTheScreen();
    expect(screen.getByLabelText('Status: Picking')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ProductRow', () => {
  it('shows Verified or To scan in words', async () => {
    await render(
      <>
        <ProductRow
          testID="done"
          seed="p1"
          brand="Lumen Skin"
          name="Dewy Barrier Cream 50ml"
          detail="SKU LS-1042"
          quantity="1 / 1"
          trailing={{ kind: 'verified' }}
          accessibilityLabel="done"
        />
        <ProductRow
          testID="todo"
          seed="p2"
          brand="Velour"
          name="Soft Focus Blush"
          detail="SKU VL-2210"
          quantity="0 / 2"
          trailing={{ kind: 'toScan' }}
          accessibilityLabel="todo"
        />
      </>,
    );
    expect(screen.getByTestId('done')).toHaveTextContent(/LUMEN SKIN.*1 \/ 1.*Verified/);
    expect(screen.getByTestId('todo')).toHaveTextContent(/0 \/ 2.*To scan/);
  });

  it('builds monograms the way the design shows them', () => {
    expect(['LUMEN SKIN', 'PETAL & PITH', 'KŌRI', 'Hearth & Hollow', 'Velour'].map(monogram)).toEqual([
      'LS',
      'P&P',
      'K',
      'H&H',
      'V',
    ]);
  });
});

describe('ShiftCard', () => {
  it('exposes shift progress and figures', async () => {
    await render(
      <ShiftCard
        statusLabel="On shift"
        live
        timeRange="9:00 am – 5:30 pm"
        headline="50m left"
        percent={90.2}
        stats={[{ value: '4', label: 'on the floor' }]}
      />,
    );
    expect(screen.getByRole('progressbar', { name: 'Shift progress' })).toHaveAccessibilityValue({ now: 90 });
    expect(screen.getByLabelText('4 on the floor')).toBeOnTheScreen();
  });

  it('hides the progress bar when there is no shift to measure', async () => {
    await render(<ShiftCard statusLabel="Not rostered" live={false} timeRange="" headline="No shift today" percent={null} stats={[]} />);
    expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  });
});

describe('AttentionItem, ShiftRow, IconButton and ScreenTitle', () => {
  it('reads attention items as one sentence', async () => {
    const onPress = jest.fn();
    await render(
      <AttentionItem title="3 orders overdue" subtitle="Oldest 53 min past due" icon="time-outline" tone="overdue" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: '3 orders overdue. Oldest 53 min past due' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('gives each shift row a named edit button', async () => {
    const onEdit = jest.fn();
    await render(
      <ShiftRow
        initials="GL"
        name="Grace Liu"
        role="Beauty Advisor · Casual"
        stateLabel="Break at 5:00 pm"
        stateTone="warn"
        time="1:00 – 9:00 pm"
        meta="30m break · 7.5h"
        onEdit={onEdit}
        accessibilityLabel="Grace Liu"
      />,
    );
    expect(screen.getByText('Break at 5:00 pm')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Edit shift for Grace Liu' }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('renders header pieces', async () => {
    await render(
      <ScreenTitle
        eyebrow="Click & Collect"
        title="Orders"
        right={<IconButton icon="notifications-outline" accessibilityLabel="Notifications, 3 unread" badge={3} onPress={jest.fn()} />}
      />,
    );
    expect(screen.getByRole('header', { name: 'Orders' })).toBeOnTheScreen();
    expect(screen.getByText('Click & Collect')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toHaveTextContent(/3/);
  });
});
