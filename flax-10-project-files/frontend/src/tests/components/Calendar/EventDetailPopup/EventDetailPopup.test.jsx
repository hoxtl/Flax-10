import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventDetailPopup from '../../../../components/Calendar/EventDetailPopup/EventDetailPopup';

vi.mock('../../../../components/Calendar/EventDetailPopup/PopupHeader', () => ({
    PopupHeader: ({ event, onClose }) => (
        <div data-testid="popup-header">
            <span>{event.title}</span>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('../../../../components/Calendar/EventDetailPopup/PopupBody', () => ({
    PopupBody: ({ event }) => <div data-testid="popup-body">{event.description}</div>,
}));

vi.mock('../../../../components/Calendar/EventDetailPopup/PopupActions', () => ({
    PopupActions: ({ actions }) => (
        <div data-testid="popup-actions">
            {actions.map((a, i) => <button key={i} onClick={a.onClick}>{a.label}</button>)}
        </div>
    ),
}));

vi.mock('../../../../components/Calendar/EventDetailPopup/usePopupPosition', () => ({
    usePopupPosition: vi.fn(() => ({ top: 100, left: 100 })),
}));

vi.mock('../../../../components/Calendar/EventDetailPopup/useClickOutside', () => ({
    useClickOutside: vi.fn(),
}));

vi.mock('../../../../components/Calendar/EventDetailPopup/useScrollClose', () => ({
    useScrollClose: vi.fn(),
}));

const baseEvent = { title: 'Meeting', description: 'Important', start_time: '2025-06-15T10:00', end_time: '2025-06-15T11:00' };

describe('EventDetailPopup', () => {
    it('renders nothing when event is null', () => {
        const { container } = render(<EventDetailPopup event={null} onClose={vi.fn()} anchorRect={{}} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders popup header when event is provided', () => {
        render(<EventDetailPopup event={baseEvent} onClose={vi.fn()} anchorRect={{}} />);
        expect(screen.getByTestId('popup-header')).toBeTruthy();
        expect(screen.getByText('Meeting')).toBeTruthy();
    });

    it('renders popup body', () => {
        render(<EventDetailPopup event={baseEvent} onClose={vi.fn()} anchorRect={{}} />);
        expect(screen.getByTestId('popup-body')).toBeTruthy();
    });

    it('renders popup actions when actions provided', () => {
        const actions = [{ label: 'Edit', onClick: vi.fn() }];
        render(<EventDetailPopup event={baseEvent} onClose={vi.fn()} anchorRect={{}} actions={actions} />);
        expect(screen.getByTestId('popup-actions')).toBeTruthy();
    });

    it('does not render popup actions when actions not provided', () => {
        render(<EventDetailPopup event={baseEvent} onClose={vi.fn()} anchorRect={{}} />);
        expect(screen.queryByTestId('popup-actions')).toBeNull();
    });
});
