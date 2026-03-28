import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ManualScheduleFields } from '../../../../components/schedules/manual/ManualScheduleFields';

vi.mock('../../../../components/schedules/shared/scheduleFormStyles', () => ({
    default: {
        fieldLabel: 'fieldLabel',
        input: 'input',
    },
}));

describe('ManualScheduleFields', () => {
    it('renders the schedule name label and input', () => {
        render(
            <ManualScheduleFields
                title=""
                setTitle={vi.fn()}
                eventSearch=""
                setEventSearch={vi.fn()}
            />
        );
        expect(screen.getByText('Schedule name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('My study schedule')).toBeInTheDocument();
    });

    it('renders the search events label and input', () => {
        render(
            <ManualScheduleFields
                title=""
                setTitle={vi.fn()}
                eventSearch=""
                setEventSearch={vi.fn()}
            />
        );
        expect(screen.getByText('Search events')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search schedule events')).toBeInTheDocument();
    });

    it('displays the current title value', () => {
        render(
            <ManualScheduleFields
                title="My Study Plan"
                setTitle={vi.fn()}
                eventSearch=""
                setEventSearch={vi.fn()}
            />
        );
        expect(screen.getByDisplayValue('My Study Plan')).toBeInTheDocument();
    });

    it('displays the current eventSearch value', () => {
        render(
            <ManualScheduleFields
                title=""
                setTitle={vi.fn()}
                eventSearch="chemistry"
                setEventSearch={vi.fn()}
            />
        );
        expect(screen.getByDisplayValue('chemistry')).toBeInTheDocument();
    });

    it('calls setTitle with new value when title input changes', () => {
        const setTitle = vi.fn();
        render(
            <ManualScheduleFields
                title=""
                setTitle={setTitle}
                eventSearch=""
                setEventSearch={vi.fn()}
            />
        );
        fireEvent.change(screen.getByPlaceholderText('My study schedule'), {
            target: { value: 'New Plan' },
        });
        expect(setTitle).toHaveBeenCalledWith('New Plan');
    });

    it('calls setEventSearch with new value when search input changes', () => {
        const setEventSearch = vi.fn();
        render(
            <ManualScheduleFields
                title=""
                setTitle={vi.fn()}
                eventSearch=""
                setEventSearch={setEventSearch}
            />
        );
        fireEvent.change(screen.getByPlaceholderText('Search schedule events'), {
            target: { value: 'lab' },
        });
        expect(setEventSearch).toHaveBeenCalledWith('lab');
    });
});
