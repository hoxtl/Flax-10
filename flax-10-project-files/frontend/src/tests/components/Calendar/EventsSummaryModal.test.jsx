import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventsSummaryModal } from '../../../components/Calendar/EventsSummaryModal/EventsSummaryModal';

const events = [
    { title: 'Morning Lecture', start_time: '2024-03-08T09:00:00Z', location: 'Room 101' },
    { title: 'Lab Session', start_time: '2024-03-08T14:00:00Z', location: '' },
];

const baseDate = new Date('2024-03-08');

function renderModal(props = {}) {
    return render(
        <EventsSummaryModal
            isOpen={true}
            onClose={vi.fn()}
            allEvents={events}
            baseDate={baseDate}
            isMutualOrSelf={true}
            {...props}
        />
    );
}

describe('EventsSummaryModal', () => {
    it('renders nothing when isOpen is false', () => {
        const { container } = renderModal({ isOpen: false });
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when isMutualOrSelf is false', () => {
        const { container } = renderModal({ isMutualOrSelf: false });
        expect(container.firstChild).toBeNull();
    });

    it('renders title with range label', () => {
        renderModal();
        expect(screen.getByText(/Events - Today/)).toBeTruthy();
    });

    it('renders close button', () => {
        renderModal();
        expect(screen.getByRole('button', { name: /close/i })).toBeTruthy();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', () => {
        const onClose = vi.fn();
        renderModal({ onClose });
        const backdrop = document.querySelector('[class*="backdrop"]');
        if (backdrop) fireEvent.mouseDown(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders range buttons', () => {
        renderModal();
        expect(screen.getByText('Today')).toBeTruthy();
        expect(screen.getByText('This Week')).toBeTruthy();
        expect(screen.getByText('This Month')).toBeTruthy();
    });

    it('changes range when button is clicked', () => {
        renderModal();
        fireEvent.click(screen.getByText('This Week'));
        expect(screen.getByText(/Events - This Week/)).toBeTruthy();
    });

    it('renders empty message when no events for range', () => {
        renderModal({ allEvents: [] });
        expect(screen.getByText('No events found for this period')).toBeTruthy();
    });

    it('resets range to today when reopened', () => {
        const { rerender } = renderModal({ isOpen: false });
        rerender(
            <EventsSummaryModal
                isOpen={false}
                onClose={vi.fn()}
                allEvents={events}
                baseDate={baseDate}
                isMutualOrSelf={true}
            />
        );
        rerender(
            <EventsSummaryModal
                isOpen={true}
                onClose={vi.fn()}
                allEvents={events}
                baseDate={baseDate}
                isMutualOrSelf={true}
            />
        );
        // range should be reset to 'today'
        expect(screen.getByText(/Events - Today/)).toBeTruthy();
    });
});
