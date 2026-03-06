import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HoverSummary } from '../../../../components/Calendar/YearView/HoverSummary';

vi.mock('../../../../context/TagContext', () => ({
    useTags: () => ({
        getTag: (id) => ({ color: '#000', label: 'Test Tag' }),
        getTagByName: (name) => ({ name, color: '#000', icon: '📚' }),
    }),
    TagProvider: ({ children }) => <div>{children}</div>
}));

describe('HoverSummary', () => {
    const defaultProps = {
        date: new Date('2025-01-01T12:00:00'),
        events: []
    };

    it('should render empty state', () => {
        render(<HoverSummary {...defaultProps} />);
        expect(screen.getByText('No events')).toBeInTheDocument();
    });

    it('should render standard event', () => {
        const events = [{
            id: 1,
            title: 'Test Event',
            start_time: '2025-01-01T10:00:00',
            end_time: '2025-01-01T11:00:00',
            tag: 1
        }];
        render(<HoverSummary {...defaultProps} events={events} />);
        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    });

    it('should render > 5 events count', () => {
        const events = Array.from({ length: 7 }, (_, i) => ({
            id: i,
            title: `Event ${i}`,
            start_time: '2025-01-01T10:00:00',
            end_time: '2025-01-01T11:00:00',
            tag: 1
        }));
        render(<HoverSummary {...defaultProps} events={events} />);
        expect(screen.getByText('+2 more events')).toBeInTheDocument();
    });

    it('should render All Day for all_day event', () => {
        const events = [{
            id: 1,
            title: 'All Day Event',
            start_time: '2025-01-01T00:00:00',
            end_time: '2025-01-02T00:00:00',
            all_day: true,
            tag: 1
        }];
        render(<HoverSummary {...defaultProps} events={events} />);
        expect(screen.getByText('All Day')).toBeInTheDocument();
    });

    it('should render ends time if starts before', () => {
        // Event started yesterday, ends today at 10am
        const events = [{
            id: 1,
            title: 'Ending Event',
            start_time: '2024-12-31T10:00:00',
            end_time: '2025-01-01T10:00:00',
            tag: 1
        }];
        render(<HoverSummary {...defaultProps} events={events} />);
        expect(screen.getByText('Ends 10:00 AM')).toBeInTheDocument();
    });

    it('should render All Day for middle day of multi-day event', () => {
        // Event starts yesterday, ends tomorrow. Today is middle.
        const events = [{
            id: 1,
            title: 'Middle Event',
            start_time: '2024-12-31T10:00:00',
            end_time: '2025-01-02T10:00:00',
            tag: 1
        }];
        render(<HoverSummary {...defaultProps} events={events} />);
        expect(screen.getAllByText('All Day')).toHaveLength(1);
    });
});
