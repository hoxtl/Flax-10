import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HourList } from '../../../../components/Calendar/week_view/components/HourList';

vi.mock('../../../../components/Calendar/day_view/dayViewHelpers', () => ({
  getHoursOfDay: vi.fn(() => [8, 9]),
}));

vi.mock('../../../../components/Calendar/week_view/components/HourCell', () => ({
  HourCell: ({ hour, date, readOnly }) => (
    <div data-testid="hour-cell">{`${hour}-${String(date)}-${String(readOnly)}`}</div>
  ),
}));

describe('HourList', () => {
  it('renders one HourCell per hour with forwarded props', () => {
    render(<HourList date="2026-03-09" readOnly />);
    const cells = screen.getAllByTestId('hour-cell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent('8-2026-03-09-true');
    expect(cells[1]).toHaveTextContent('9-2026-03-09-true');
  });
});
