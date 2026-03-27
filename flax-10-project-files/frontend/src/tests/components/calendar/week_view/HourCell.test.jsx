import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const mockUseTimeSlotDrop = vi.fn(() => ({
    mergedProps: {},
    isOver: false,
    highlightQuarter: null,
}));

const mockUseResizeHighlight = vi.fn(() => ({ resizeHighlight: null }));

vi.mock('../../../../components/calendar/hooks/useTimeSlotDrop', () => ({
    useTimeSlotDrop: (...args) => mockUseTimeSlotDrop(...args),
}));

vi.mock('../../../../context/ResizeHighlightContext', () => ({
    useResizeHighlight: () => mockUseResizeHighlight(),
}));

vi.mock('../../../../components/calendar/week_view/components/HighlightOverlay', () => ({
    HighlightOverlay: ({ quarter, type }) => (
        <div data-testid="highlight-overlay" data-quarter={quarter} data-type={type} />
    ),
}));

vi.mock('../../../../components/calendar/calendarConstants', () => ({
    SLOT_HEIGHT: 60,
}));

import { HourCell } from '../../../../components/calendar/week_view/components/HourCell';

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

    it('renders drop HighlightOverlay when isOver is true', () => {
        mockUseTimeSlotDrop.mockReturnValueOnce({
            mergedProps: {},
            isOver: true,
            highlightQuarter: 2,
        });
        const { getByTestId, container } = render(<HourCell hour={9} date={date} readOnly={false} />);
        expect(container.querySelector('.hour-cell.drop-target')).toBeTruthy();
        const overlay = getByTestId('highlight-overlay');
        expect(overlay).toBeTruthy();
        expect(overlay.getAttribute('data-type')).toBe('drop');
        expect(overlay.getAttribute('data-quarter')).toBe('2');
    });

    it('renders resize HighlightOverlay when isResizeTarget matches hour and date', () => {
        mockUseTimeSlotDrop.mockReturnValueOnce({
            mergedProps: {},
            isOver: false,
            highlightQuarter: null,
        });
        const resizeDate = new Date('2024-03-04');
        mockUseResizeHighlight.mockReturnValueOnce({
            resizeHighlight: { hour: 9, date: resizeDate, quarter: 1 },
        });
        const { getByTestId, container } = render(<HourCell hour={9} date={resizeDate} readOnly={false} />);
        expect(container.querySelector('.hour-cell.drop-target')).toBeTruthy();
        const overlay = getByTestId('highlight-overlay');
        expect(overlay.getAttribute('data-type')).toBe('resize');
        expect(overlay.getAttribute('data-quarter')).toBe('1');
    });

    it('uses resize overlay with null quarter when resizeHighlight has no quarter', () => {
        mockUseTimeSlotDrop.mockReturnValueOnce({
            mergedProps: {},
            isOver: false,
            highlightQuarter: null,
        });
        const resizeDate = new Date('2024-03-04');
        mockUseResizeHighlight.mockReturnValueOnce({
            resizeHighlight: { hour: 9, date: resizeDate },
        });
        const { getByTestId } = render(<HourCell hour={9} date={resizeDate} readOnly={false} />);
        const overlay = getByTestId('highlight-overlay');
        expect(overlay.getAttribute('data-type')).toBe('resize');
        expect(overlay.getAttribute('data-quarter')).toBeFalsy();
    });

    it('does not treat as resize target when hour or date does not match', () => {
        mockUseTimeSlotDrop.mockReturnValueOnce({
            mergedProps: {},
            isOver: false,
            highlightQuarter: null,
        });
        mockUseResizeHighlight.mockReturnValueOnce({
            resizeHighlight: { hour: 10, date: new Date('2024-03-05'), quarter: 1 },
        });
        const { queryByTestId, container } = render(<HourCell hour={9} date={date} readOnly={false} />);
        expect(container.querySelector('.hour-cell.drop-target')).toBeFalsy();
        expect(queryByTestId('highlight-overlay')).toBeNull();
    });
});
