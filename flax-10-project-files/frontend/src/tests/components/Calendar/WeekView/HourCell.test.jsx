import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../../../components/Calendar/hooks/useTimeSlotDrop', () => ({
    useTimeSlotDrop: vi.fn(() => ({
        mergedProps: {},
        isOver: false,
        highlightQuarter: null,
    })),
}));

vi.mock('../../../../context/ResizeHighlightContext', () => ({
    useResizeHighlight: vi.fn(() => ({ resizeHighlight: null })),
}));

vi.mock('../../../../components/Calendar/WeekView/components/HighlightOverlay', () => ({
    HighlightOverlay: ({ quarter, type }) => (
        <div data-testid="highlight-overlay" data-quarter={quarter} data-type={type} />
    ),
}));

vi.mock('../../../../components/Calendar/calendarConstants', () => ({
    SLOT_HEIGHT: 60,
}));

import { HourCell } from '../../../../components/Calendar/WeekView/components/HourCell';

const date = new Date('2024-03-04');

describe('HourCell', () => {
    it('renders a simple div in readOnly mode without highlight', () => {
        const { container } = render(<HourCell hour={9} date={date} readOnly={true} />);
        expect(container.querySelector('.hour-cell')).toBeTruthy();
    });

    it('does not render HighlightOverlay in readOnly mode', () => {
        const { queryByTestId } = render(<HourCell hour={9} date={date} readOnly={true} />);
        expect(queryByTestId('highlight-overlay')).toBeNull();
    });

    it('renders interactive cell when not readOnly', () => {
        const { container } = render(<HourCell hour={9} date={date} readOnly={false} />);
        expect(container.querySelector('.hour-cell')).toBeTruthy();
    });
});
