import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../../../../components/Calendar/DraggableEvent', () => ({
    DraggableEvent: ({ event, readOnly }) => (
        <div data-testid="draggable-event" data-readonly={String(readOnly)}>
            {event.title}
        </div>
    ),
}));

vi.mock('../../../../components/Calendar/day_view/dayViewHelpers', () => ({
    calculateEventStyle: vi.fn(() => ({ top: 0, height: 60 })),
}));

vi.mock('../../../../components/Calendar/calendarConstants', () => ({
    SLOT_HEIGHT: 60,
}));

import { ColumnEvents } from '../../../../components/Calendar/week_view/components/ColumnEvents';

const date = new Date('2024-03-04');
const events = [
    { id: 1, title: 'Morning Meeting', start_time: '2024-03-04T09:00:00Z' },
    { id: 2, title: 'Afternoon Lecture', start_time: '2024-03-04T14:00:00Z' },
];

describe('ColumnEvents', () => {
    it('renders a DraggableEvent for each event', () => {
        render(<ColumnEvents events={events} date={date} readOnly={false} />);
        const evts = screen.getAllByTestId('draggable-event');
        expect(evts.length).toBe(2);
    });

    it('renders event titles', () => {
        render(<ColumnEvents events={events} date={date} readOnly={false} />);
        expect(screen.getByText('Morning Meeting')).toBeTruthy();
        expect(screen.getByText('Afternoon Lecture')).toBeTruthy();
    });

    it('passes readOnly to DraggableEvent', () => {
        render(<ColumnEvents events={events} date={date} readOnly={true} />);
        const evts = screen.getAllByTestId('draggable-event');
        evts.forEach(el => expect(el.getAttribute('data-readonly')).toBe('true'));
    });

    it('renders nothing when events is empty', () => {
        const { container } = render(<ColumnEvents events={[]} date={date} readOnly={false} />);
        expect(container.querySelector('.column-events').children.length).toBe(0);
    });
});
