/**
 * Tests for EventPopover - event detail popover component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventPopover } from '../../../../components/Calendar/EventPopover/EventPopover';
import { createMockEvent, createMockTag } from '../mocks/calendarMocks';

vi.mock('../../../../components/Calendar/EventPopover/popoverUtils', () => ({
    calculatePopoverPosition: () => ({ top: 100, left: 200, placement: 'right' }),
    calculateArrowPosition: () => 50,
}));

class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

beforeEach(() => { global.ResizeObserver = MockResizeObserver; });
afterEach(() => { delete global.ResizeObserver; });

describe('EventPopover', () => {
    const anchor = { top: 100, left: 100, right: 150, bottom: 150, width: 50, height: 50 };
    const onClose = vi.fn();
    const tag = createMockTag();

    beforeEach(() => vi.clearAllMocks());

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
        const event = createMockEvent({ title: 'My Event' });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} tag={tag} />);
        expect(screen.getByText('My Event')).toBeInTheDocument();
    });

    it('renders tag badge when tag provided', () => {
        const event = createMockEvent();
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} tag={tag} />);
        expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('renders location when provided', () => {
        const event = createMockEvent({ location: 'Room 101' });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        expect(screen.getByText('Room 101')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        const event = createMockEvent({ description: 'Event details' });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        expect(screen.getByText('Event details')).toBeInTheDocument();
    });

    it('toggles description expansion on click', () => {
        const event = createMockEvent({ description: 'A long description text' });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        fireEvent.click(screen.getByText('A long description text'));
    });

    it('renders module badge for module events', () => {
        const event = createMockEvent({ module_name: 'CS101' });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        expect(screen.getByText('CS101')).toBeInTheDocument();
    });

    it('renders society badge for society events', () => {
        const event = createMockEvent({ society_name: 'Chess Club' });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        expect(screen.getByText('Chess Club')).toBeInTheDocument();
    });

    it('renders action buttons when not readOnly', () => {
        const actions = [{ label: 'Edit', onClick: vi.fn() }, { label: 'Delete', onClick: vi.fn(), variant: 'danger' }];
        render(<EventPopover event={createMockEvent()} anchorRect={anchor} onClose={onClose} actions={actions} />);
        expect(screen.getByTitle('Edit')).toBeInTheDocument();
        expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('does not render actions when readOnly', () => {
        const actions = [{ label: 'Edit', onClick: vi.fn() }];
        render(<EventPopover event={createMockEvent()} anchorRect={anchor} onClose={onClose} actions={actions} readOnly />);
        expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    });

    it('calls onClose and action.onClick when action button clicked', () => {
        const actionClick = vi.fn();
        const actions = [{ label: 'Edit', onClick: actionClick }];
        render(<EventPopover event={createMockEvent()} anchorRect={anchor} onClose={onClose} actions={actions} />);
        fireEvent.click(screen.getByTitle('Edit'));
        expect(onClose).toHaveBeenCalled();
        expect(actionClick).toHaveBeenCalled();
    });

    it('calls onClose on Escape key', () => {
        render(<EventPopover event={createMockEvent()} anchorRect={anchor} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose on overlay click', () => {
        render(<EventPopover event={createMockEvent()} anchorRect={anchor} onClose={onClose} />);
        const overlay = document.querySelector('[class*="popoverOverlay"]');
        fireEvent.mouseDown(overlay);
        expect(onClose).toHaveBeenCalled();
    });

    it('renders moduleCode fallback for module events', () => {
        const event = createMockEvent({ moduleCode: 'COMP101' });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        expect(screen.getByText('COMP101')).toBeInTheDocument();
    });

    it('renders module number fallback', () => {
        const event = createMockEvent({ module: 5 });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        expect(screen.getByText('Module 5')).toBeInTheDocument();
    });

    it('renders society fallback text', () => {
        const event = createMockEvent({ society_id: 3 });
        render(<EventPopover event={event} anchorRect={anchor} onClose={onClose} />);
        expect(screen.getByText('Society Event')).toBeInTheDocument();
    });
});
