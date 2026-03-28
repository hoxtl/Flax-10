import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ManualScheduleEventList } from '../../../../components/schedules/manual/ManualScheduleEventList';

vi.mock('../../../../components/schedules/shared/scheduleFormStyles', () => ({
    default: {
        eventList: 'eventList',
        muted: 'muted',
        checkRow: 'checkRow',
    },
}));

describe('ManualScheduleEventList', () => {
    it('shows "no events" message when events array is empty', () => {
        render(
            <ManualScheduleEventList events={[]} filteredEvents={[]} selected={[]} toggle={vi.fn()} />
        );
        expect(screen.getByText(/No events tagged "schedule" were found\./)).toBeInTheDocument();
    });

    it('does not show "no events" message when events exist', () => {
        render(
            <ManualScheduleEventList
                events={[{ id: 1, title: 'Lecture' }]}
                filteredEvents={[{ id: 1, title: 'Lecture' }]}
                selected={[]}
                toggle={vi.fn()}
            />
        );
        expect(screen.queryByText(/No events tagged "schedule" were found\./)).toBeNull();
    });

    it('shows "no search results" message when events exist but filteredEvents is empty', () => {
        render(
            <ManualScheduleEventList
                events={[{ id: 1, title: 'Lecture' }]}
                filteredEvents={[]}
                selected={[]}
                toggle={vi.fn()}
            />
        );
        expect(screen.getByText(/No events match your search\./)).toBeInTheDocument();
    });

    it('does not show "no search results" when filteredEvents is not empty', () => {
        render(
            <ManualScheduleEventList
                events={[{ id: 1, title: 'Lecture' }]}
                filteredEvents={[{ id: 1, title: 'Lecture' }]}
                selected={[]}
                toggle={vi.fn()}
            />
        );
        expect(screen.queryByText(/No events match your search\./)).toBeNull();
    });

    it('renders a checkbox for each filtered event', () => {
        const events = [
            { id: 1, title: 'Lecture A' },
            { id: 2, title: 'Lecture B' },
        ];
        render(
            <ManualScheduleEventList events={events} filteredEvents={events} selected={[]} toggle={vi.fn()} />
        );
        expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    });

    it('renders checked checkbox for selected event', () => {
        const events = [{ id: 1, title: 'Lecture' }];
        render(
            <ManualScheduleEventList events={events} filteredEvents={events} selected={[1]} toggle={vi.fn()} />
        );
        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('renders unchecked checkbox for unselected event', () => {
        const events = [{ id: 1, title: 'Lecture' }];
        render(
            <ManualScheduleEventList events={events} filteredEvents={events} selected={[]} toggle={vi.fn()} />
        );
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('calls toggle with event id when checkbox is clicked', () => {
        const toggle = vi.fn();
        const events = [{ id: 5, title: 'Workshop' }];
        render(
            <ManualScheduleEventList events={events} filteredEvents={events} selected={[]} toggle={toggle} />
        );
        fireEvent.click(screen.getByRole('checkbox'));
        expect(toggle).toHaveBeenCalledWith(5);
    });

    it('renders event titles as labels', () => {
        const events = [{ id: 1, title: 'My Event' }];
        render(
            <ManualScheduleEventList events={events} filteredEvents={events} selected={[]} toggle={vi.fn()} />
        );
        expect(screen.getByText('My Event')).toBeInTheDocument();
    });
});
