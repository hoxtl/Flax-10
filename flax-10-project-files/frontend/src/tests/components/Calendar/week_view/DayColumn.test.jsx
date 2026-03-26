import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayColumn } from '../../../../components/Calendar/week_view/DayColumn';

vi.mock('../../../../components/Calendar/week_view/components/HourList', () => ({
  HourList: ({ date, readOnly }) => <div data-testid="hour-list">{`${date}-${String(readOnly)}`}</div>,
}));

vi.mock('../../../../components/Calendar/week_view/components/ColumnEvents', () => ({
  ColumnEvents: ({ events, date, readOnly }) => (
    <div data-testid="column-events">{`${events.length}-${date}-${String(readOnly)}`}</div>
  ),
}));

describe('DayColumn', () => {
  it('renders HourList and ColumnEvents with propagated props', () => {
    render(<DayColumn date="2026-03-09" events={[{ id: 1 }, { id: 2 }]} readOnly={false} />);
    expect(screen.getByTestId('hour-list')).toHaveTextContent('2026-03-09-false');
    expect(screen.getByTestId('column-events')).toHaveTextContent('2-2026-03-09-false');
  });
});
