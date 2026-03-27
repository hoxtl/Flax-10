/**
 * Tests for EventPopover - event detail popover component.
 */

import { render as rtlRender, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { EventPopover } from '../../../../components/calendar/event_popover/EventPopover';
import { createMockEvent, createMockTag } from '../mocks/calendarMocks';

const mockCalculatePopoverPosition = vi.fn(() => ({ top: 100, left: 200, placement: 'right' }));
const mockCalculateArrowPosition = vi.fn(() => 50);

vi.mock('../../../../components/calendar/event_popover/popoverUtils', () => ({
    calculatePopoverPosition: (...args) => mockCalculatePopoverPosition(...args),
    calculateArrowPosition: (...args) => mockCalculateArrowPosition(...args),
}));

class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

beforeEach(() => { global.ResizeObserver = MockResizeObserver; });
afterEach(() => { delete global.ResizeObserver; });

const render = (ui) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);

describe('EventPopover', () => {
    const anchor = { top: 100, left: 100, right: 150, bottom: 150, width: 50, height: 50 };
    const onClose = vi.fn();
    const tag = createMockTag();

    function renderPopover(props = {}) {
        return render(
            <EventPopover
                event={createMockEvent()}
                anchorRect={anchor}
                onClose={onClose}
                {...props}
            />
        );
    }

    beforeEach(() => {
        vi.clearAllMocks();
        mockCalculatePopoverPosition.mockReturnValue({ top: 100, left: 200, placement: 'right' });
        mockCalculateArrowPosition.mockReturnValue(50);
    });

    it('renders null when event is null', () => {
        const { container } = render(<EventPopover event={null} anchorRect={anchor} onClose={onClose} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders null when anchorRect is null', () => {
        const event = createMockEvent();
        const { container } = render(<EventPopover event={event} anchorRect={null} onClose={onClose} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders event title', () => {
        renderPopover({ event: createMockEvent({ title: 'My Event' }), tag });
        expect(screen.getByText('My Event')).toBeInTheDocument();
    });

    it('renders tag badge when tag provided', () => {
        renderPopover({ tag });
        expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('renders location when provided', () => {
        renderPopover({ event: createMockEvent({ location: 'Room 101' }) });
        expect(screen.getByText('Room 101')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        renderPopover({ event: createMockEvent({ description: 'Event details' }) });
        expect(screen.getByText('Event details')).toBeInTheDocument();
    });

    it('toggles description expansion on click', () => {
        renderPopover({ event: createMockEvent({ description: 'A long description text' }) });
        fireEvent.click(screen.getByText('A long description text'));
    });

    it('renders module badge for module events', () => {
        renderPopover({ event: createMockEvent({ module_name: 'CS101' }) });
        expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    it('renders society badge for society events', () => {
        renderPopover({ event: createMockEvent({ society_name: 'Chess Club' }) });
        expect(screen.getByText('Chess Club')).toBeInTheDocument();
    });

    it('renders action buttons when not readOnly', () => {
        const actions = [{ label: 'Edit', onClick: vi.fn() }, { label: 'Delete', onClick: vi.fn(), variant: 'danger' }];
        renderPopover({ actions });
        expect(screen.getByTitle('Edit')).toBeInTheDocument();
        expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('does not render actions when readOnly', () => {
        const actions = [{ label: 'Edit', onClick: vi.fn() }];
        renderPopover({ actions, readOnly: true });
        expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    });

    it('calls onClose and action.onClick when action button clicked', () => {
        const actionClick = vi.fn();
        const actions = [{ label: 'Edit', onClick: actionClick }];
        renderPopover({ actions });
        fireEvent.click(screen.getByTitle('Edit'));
        expect(onClose).toHaveBeenCalled();
        expect(actionClick).toHaveBeenCalled();
    });

    it('renders the raw label for unknown action types', () => {
        const actionClick = vi.fn();
        renderPopover({ actions: [{ label: 'Share', onClick: actionClick }] });
        fireEvent.click(screen.getByTitle('Share'));
        expect(screen.getByTitle('Share')).toHaveTextContent('Share');
        expect(actionClick).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', () => {
        renderPopover();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on overlay click', () => {
        renderPopover();
        const overlay = document.querySelector('[class*="popoverOverlay"]');
        fireEvent.mouseDown(overlay);
        expect(onClose).toHaveBeenCalled();
    });

    it('applies pixel-based custom properties for popover positioning', () => {
        renderPopover();
        const popover = document.querySelector('[class*="popoverContainer"]');
        expect(popover.style.getPropertyValue('--popover-top')).toBe('100px');
        expect(popover.style.getPropertyValue('--popover-left')).toBe('200px');
    });

    it.each([
        [{ top: 80, left: 180, placement: 'top' }, 'popoverArrowTop', 'left', '50px'],
        [{ top: 80, left: 20, placement: 'left' }, 'popoverArrowLeft', 'top', '50px'],
    ])('renders %s arrow placement', (position, arrowClass, styleProp, styleValue) => {
        mockCalculatePopoverPosition.mockReturnValue(position);
        renderPopover();
        const arrow = document.querySelector('[class*="popoverArrow"]');
        expect(arrow.className).toContain(arrowClass);
        expect(arrow.style[styleProp]).toBe(styleValue);
    });

    it('falls back to the none arrow class for unrecognised placements', () => {
        mockCalculatePopoverPosition.mockReturnValue({ top: 80, left: 20, placement: 'diagonal' });
        renderPopover();
        expect(document.querySelector('[class*="popoverArrow"]').className).toContain('popoverArrowNone');
    });

    it('renders moduleCode fallback for module events', () => {
        renderPopover({ event: createMockEvent({ moduleCode: 'COMP101' }) });
        expect(screen.getByText('COMP101')).toBeInTheDocument();
    });

    it('renders module number fallback', () => {
        renderPopover({ event: createMockEvent({ module: 5 }) });
        expect(screen.getByText('Module 5')).toBeInTheDocument();
    });

    it('renders society fallback text', () => {
        renderPopover({ event: createMockEvent({ society_id: 3 }) });
        expect(screen.getByText('Society Event')).toBeInTheDocument();
    });
});
