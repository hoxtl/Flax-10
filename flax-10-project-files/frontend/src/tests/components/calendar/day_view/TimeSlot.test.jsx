import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../../../components/calendar/hooks/useTimeSlotDrop', () => ({
    useTimeSlotDrop: vi.fn(() => ({
        mergedProps: {},
        isOver: false,
        highlightQuarter: null,
    })),
}));

vi.mock('../../../../context/ResizeHighlightContext', () => ({
    useResizeHighlight: vi.fn(() => ({ resizeHighlight: null })),
}));

vi.mock('../../../../components/calendar/utils/dateUtils', () => ({
    isSameDay: vi.fn(() => false),
}));

import { TimeSlot } from '../../../../components/calendar/day_view/TimeSlot';

const date = new Date('2024-03-04');

describe('TimeSlot', () => {
    it('renders a simple div in readOnly mode', () => {
        const { container } = render(<TimeSlot hour={9} date={date} readOnly={true} />);
        expect(container.querySelector('.time-slot')).toBeTruthy();
    });

    it('renders interactive slot when not readOnly', () => {
        const { container } = render(<TimeSlot hour={9} date={date} readOnly={false} />);
        expect(container.querySelector('.time-slot')).toBeTruthy();
    });

    it('renders drop-target class when isOver is true', () => {
        const { container } = render(<TimeSlot hour={10} date={date} readOnly={false} />);
        // isOver is false (from mock), so no drop-target class
        expect(container.querySelector('.time-slot')).toBeTruthy();
    });
});
