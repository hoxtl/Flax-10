import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CalendarProvider, useCalendar, useCalendarDispatch, useEventModal } from '../../context/CalendarContext';
import { useEffect } from 'react';

// setup tests?
// Since we test context, we need a consumer component.

vi.mock('../../hooks/useReminderNotifications', () => ({
    useReminderNotifications: vi.fn(),
}));

const TestConsumer = () => {
    const state = useCalendar();
    const dispatch = useCalendarDispatch();
    return (
        <div>
            <span data-testid="view-mode">{state.viewMode}</span>
            <button onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'month' })}>
                Change View
            </button>
        </div>
    );
};

const ModalConsumer = () => {
    const { isModalOpen, openModal, closeModal } = useEventModal();
    return (
        <div>
            <span data-testid="modal-status">{isModalOpen ? 'Open' : 'Closed'}</span>
            <button onClick={() => openModal({ id: 1 }, 'edit')}>Open Edit</button>
            <button onClick={closeModal}>Close</button>
        </div>
    );
};

describe('CalendarContext', () => {
    it('should provide initial state', () => {
        render(
            <CalendarProvider>
                <TestConsumer />
            </CalendarProvider>
        );
        expect(screen.getByTestId('view-mode')).toHaveTextContent('week');
    });

    it('should update state via dispatch', async () => {
        render(
            <CalendarProvider>
                <TestConsumer />
            </CalendarProvider>
        );
        const button = screen.getByText('Change View');
        await act(async () => {
            button.click();
        });
        expect(screen.getByTestId('view-mode')).toHaveTextContent('month');
    });

    it('should throw error if used outside provider', () => {
        // Suppress console.error for this test as React logs the error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => render(<TestConsumer />)).toThrow('useCalendar must be used within CalendarProvider');

        consoleSpy.mockRestore();
    });

    const FilterConsumer = () => {
        const { events } = useCalendar();
        const dispatch = useCalendarDispatch();
        useEffect(() => {
            dispatch({
                type: 'SET_EVENTS',
                payload: [
                    { id: 1, title: 'Work Event', tag_name: 'work' },
                    { id: 2, title: 'Study Event', tag_name: 'study' }
                ]
            });
        }, [dispatch]);

        return (
            <div>
                <ul>{events.map(e => <li key={e.id}>{e.title}</li>)}</ul>
                <button onClick={() => dispatch({ type: 'SET_FILTER', payload: 'work' })}>Filter Work</button>
            </div>
        );
    };

    it('should filter events based on context filter', () => {
        render(
            <CalendarProvider>
                <FilterConsumer />
            </CalendarProvider>
        );

        expect(screen.getByText('Work Event')).toBeInTheDocument();
        expect(screen.getByText('Study Event')).toBeInTheDocument();

        act(() => { screen.getByText('Filter Work').click(); });

        expect(screen.getByText('Work Event')).toBeInTheDocument();
        expect(screen.queryByText('Study Event')).not.toBeInTheDocument();
    });
});

describe('useEventModal', () => {
    it('should manage modal state', async () => {
        render(
            <CalendarProvider>
                <ModalConsumer />
            </CalendarProvider>
        );

        expect(screen.getByTestId('modal-status')).toHaveTextContent('Closed');

        await act(async () => {
            screen.getByText('Open Edit').click();
        });
        expect(screen.getByTestId('modal-status')).toHaveTextContent('Open');

        await act(async () => {
            screen.getByText('Close').click();
        });
        expect(screen.getByTestId('modal-status')).toHaveTextContent('Closed');
    });
});
