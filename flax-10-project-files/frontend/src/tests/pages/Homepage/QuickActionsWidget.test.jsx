import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuickActionsWidget } from '../../../pages/Homepage/components/QuickActionsWidget';

vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }) => <div className={className}>{children}</div>,
        button: ({ children, className, onClick, type, ...props }) => (
            <button className={className} onClick={onClick} type={type}>{children}</button>
        ),
        span: ({ children, className, ...props }) => <span className={className}>{children}</span>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('QuickActionsWidget', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Quick Actions header', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        expect(screen.getByText('Quick Actions')).toBeTruthy();
    });

    it('renders Start Focus Session button', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        expect(screen.getByText('Start Focus Session')).toBeTruthy();
    });

    it('renders Add Event button', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        expect(screen.getByText('Add Event')).toBeTruthy();
    });

    it('renders Review Day Plan button', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        expect(screen.getByText(/Review Day Plan/)).toBeTruthy();
    });

    it('renders Plan my journey button', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        expect(screen.getByText('Plan my journey')).toBeTruthy();
    });

    it('calls onStartFocus when provided and focus button is clicked', () => {
        const onStartFocus = vi.fn();
        render(<MemoryRouter><QuickActionsWidget onStartFocus={onStartFocus} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Start Focus Session'));
        expect(onStartFocus).toHaveBeenCalledTimes(1);
    });

    it('navigates to /timer when onStartFocus is not provided', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        fireEvent.click(screen.getByText('Start Focus Session'));
        expect(mockNavigate).toHaveBeenCalledWith('/timer', expect.any(Object));
    });

    it('calls onAddEvent when provided and Add Event is clicked', () => {
        const onAddEvent = vi.fn();
        render(<MemoryRouter><QuickActionsWidget onAddEvent={onAddEvent} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Add Event'));
        expect(onAddEvent).toHaveBeenCalledTimes(1);
    });

    it('navigates to /calendar when onAddEvent is not provided', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        fireEvent.click(screen.getByText('Add Event'));
        expect(mockNavigate).toHaveBeenCalledWith('/calendar');
    });

    it('navigates to /map when Plan my journey is clicked', () => {
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        fireEvent.click(screen.getByText('Plan my journey'));
        expect(mockNavigate).toHaveBeenCalledWith('/map');
    });

    it('dispatches flax-open-chat event when Review Day Plan is clicked', () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        fireEvent.click(screen.getByText(/Review Day Plan/));
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'flax-open-chat' }));
        dispatchSpy.mockRestore();
    });

    it('navigates to /calendar when Review Day Plan dispatch fails', () => {
        vi.spyOn(window, 'dispatchEvent').mockImplementation(() => { throw new Error('fail'); });
        render(<MemoryRouter><QuickActionsWidget /></MemoryRouter>);
        fireEvent.click(screen.getByText(/Review Day Plan/));
        expect(mockNavigate).toHaveBeenCalledWith('/calendar');
        vi.restoreAllMocks();
    });

    it('shows focus window sub when onStartFocus and focusWindowDuration provided', () => {
        render(<MemoryRouter><QuickActionsWidget onStartFocus={vi.fn()} focusWindowDuration="2h" /></MemoryRouter>);
        expect(screen.getByText('2h window available')).toBeTruthy();
    });

    it('shows generic focus window text when duration not provided', () => {
        render(<MemoryRouter><QuickActionsWidget onStartFocus={vi.fn()} /></MemoryRouter>);
        expect(screen.getByText('Focus window available now')).toBeTruthy();
    });
});
