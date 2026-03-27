import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../../components/calendar/day_view/dayViewHelpers', () => ({
    getHoursOfDay: vi.fn(() => [0, 6, 12, 18, 23]),
    formatHour: vi.fn(h => `${h}:00`),
}));

import { TimeLabels } from '../../../../components/calendar/week_view/TimeLabels';

describe('TimeLabels', () => {
    it('renders a time label for each hour', () => {
        render(<TimeLabels />);
        expect(screen.getByText('0:00')).toBeTruthy();
        expect(screen.getByText('6:00')).toBeTruthy();
        expect(screen.getByText('12:00')).toBeTruthy();
        expect(screen.getByText('18:00')).toBeTruthy();
        expect(screen.getByText('23:00')).toBeTruthy();
    });

    it('renders 5 time label cells', () => {
        const { container } = render(<TimeLabels />);
        const cells = container.querySelectorAll('.time-label-cell');
        expect(cells.length).toBe(5);
    });
});
