import { vi } from 'vitest';
import React from 'react';

/**
 * Shared UI mocks for the Society module to reduce duplication in test files.
 */

export const mockConfirm = vi.fn(() => vi.fn().mockResolvedValue(true));

export const mockEventModal = {
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isModalOpen: false,
    modalEvent: null,
    modalInitialDate: null,
};

export const MockMonthView = ({ events, onEventClick, onMoreClick }) => (
    <div data-testid="month-view">
        {events?.map(e => (
            <button key={e.id} onClick={(ev) => onEventClick(e, ev.target.getBoundingClientRect())}>
                {e.title}-click
            </button>
        ))}
        <button onClick={() => onMoreClick(new Date())}>summary</button>
    </div>
);

export const MockEventPopover = ({ event, actions }) => (
    <div data-testid="event-popover">
        <span>{event.title}</span>
        {actions?.map(a => <button key={a.label} onClick={a.onClick}>{a.label}</button>)}
    </div>
);

export const MockEventModal = ({ onSubmit, onDelete }) => (
    <div data-testid="event-modal">
        <button onClick={() => onSubmit({ title: 'New' })}>submit</button>
        {onDelete && <button onClick={onDelete}>delete</button>}
    </div>
);

export const MockSyncButton = () => <div data-testid="sync-button" />;
export const MockTagFilterBar = () => <div data-testid="filter-bar" />;
export const MockTagManager = () => <div data-testid="tag-manager" />;
export const MockSummaryModal = ({ isOpen }) => isOpen ? <div data-testid="summary-modal" /> : null;
