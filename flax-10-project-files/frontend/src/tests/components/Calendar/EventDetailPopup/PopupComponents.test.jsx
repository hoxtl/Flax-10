import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PopupHeader } from '../../../../components/Calendar/EventDetailPopup/PopupHeader';
import { PopupBody } from '../../../../components/Calendar/EventDetailPopup/PopupBody';
import { PopupActions } from '../../../../components/Calendar/EventDetailPopup/PopupActions';

vi.mock('../../../../components/Calendar/utils/dateUtils', () => ({
    formatDateRange: vi.fn(() => '15 Jun 2025'),
    formatTimeRange: vi.fn(() => '10:00 – 11:00'),
}));

// PopupHeader tests
describe('PopupHeader', () => {
    const event = { title: 'Team Meeting', source: 'manual' };

    it('renders event title', () => {
        render(<PopupHeader event={event} onClose={vi.fn()} />);
        expect(screen.getByText('Team Meeting')).toBeTruthy();
    });

    it('renders close button', () => {
        render(<PopupHeader event={event} onClose={vi.fn()} />);
        expect(screen.getByRole('button')).toBeTruthy();
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(<PopupHeader event={event} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders tag badge when tag is provided', () => {
        const tag = { id: 'work', label: 'Work', color: '#ff0000' };
        render(<PopupHeader event={event} tag={tag} onClose={vi.fn()} />);
        expect(screen.getByText('Work')).toBeTruthy();
    });

    it('does not render tag badge when tag id is "none"', () => {
        const tag = { id: 'none', label: 'None' };
        render(<PopupHeader event={event} tag={tag} onClose={vi.fn()} />);
        expect(screen.queryByText('None')).toBeNull();
    });

    it('uses tag.name when tag.label is missing in TagBadge', () => {
        const tag = { id: 'custom', name: 'Custom Tag', color: '#00ff00' };
        render(<PopupHeader event={event} tag={tag} onClose={vi.fn()} />);
        expect(screen.getByText('Custom Tag')).toBeTruthy();
    });

    it('uses default color when tag.color is missing', () => {
        const tag = { id: 'work', label: 'Work' };
        render(<PopupHeader event={event} tag={tag} onClose={vi.fn()} />);
        expect(screen.getByText('Work')).toBeTruthy();
    });

    it('renders society badge for society events', () => {
        const societyEvent = { title: 'Event', source: 'society', society_name: 'Chess Club' };
        render(<PopupHeader event={societyEvent} onClose={vi.fn()} />);
        expect(screen.getByText('Chess Club')).toBeTruthy();
    });

    it('renders module badge for module events', () => {
        const moduleEvent = { title: 'Lecture', source: 'module_enrollment', module_name: 'MATH101' };
        render(<PopupHeader event={moduleEvent} onClose={vi.fn()} />);
        expect(screen.getByText('MATH101')).toBeTruthy();
    });

    it('renders module badge for deadline events', () => {
        const moduleEvent = { title: 'Deadline', source: 'module_deadline', module_name: 'CS101' };
        render(<PopupHeader event={moduleEvent} onClose={vi.fn()} />);
        expect(screen.getByText('CS101')).toBeTruthy();
    });
});

// PopupBody tests
describe('PopupBody', () => {
    const baseEvent = { start_time: '2025-06-15T10:00', end_time: '2025-06-15T11:00', all_day: false };

    it('renders date range', () => {
        render(<PopupBody event={baseEvent} />);
        expect(screen.getByText('15 Jun 2025')).toBeTruthy();
    });

    it('renders time range', () => {
        render(<PopupBody event={baseEvent} />);
        expect(screen.getByText('10:00 – 11:00')).toBeTruthy();
    });

    it('renders location when provided', () => {
        render(<PopupBody event={{ ...baseEvent, location: 'Room 101' }} />);
        expect(screen.getByText('Room 101')).toBeTruthy();
    });

    it('does not render location when not provided', () => {
        render(<PopupBody event={baseEvent} />);
        expect(screen.queryByText('Room 101')).toBeNull();
    });

    it('renders description when provided', () => {
        render(<PopupBody event={{ ...baseEvent, description: 'Meeting notes' }} />);
        expect(screen.getByText('Meeting notes')).toBeTruthy();
    });

    it('does not render description when not provided', () => {
        render(<PopupBody event={baseEvent} />);
        expect(screen.queryByText('Meeting notes')).toBeNull();
    });
});

// PopupActions tests
describe('PopupActions', () => {
    it('renders nothing when actions is empty', () => {
        const { container } = render(<PopupActions actions={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when actions is null', () => {
        const { container } = render(<PopupActions actions={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders action buttons', () => {
        const actions = [
            { label: 'Edit', onClick: vi.fn() },
            { label: 'Delete', onClick: vi.fn(), variant: 'danger' },
        ];
        render(<PopupActions actions={actions} />);
        expect(screen.getByText('Edit')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
    });

    it('calls onClick when action button is clicked', () => {
        const onClick = vi.fn();
        const actions = [{ label: 'Edit', onClick }];
        render(<PopupActions actions={actions} />);
        fireEvent.click(screen.getByText('Edit'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
