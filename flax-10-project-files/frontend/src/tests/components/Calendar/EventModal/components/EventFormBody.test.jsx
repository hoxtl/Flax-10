import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventFormBody } from '../../../../../components/Calendar/EventModal/components/EventFormBody';

vi.mock('../../../../../components/Calendar/EventModal/components/FormField', () => ({
    FormField: ({ label, value, onChange }) => (
        <div data-testid={`field-${label}`}>
            <label>{label}</label>
            <input value={value || ''} onChange={(e) => onChange && onChange(e)} aria-label={label} />
        </div>
    ),
}));
vi.mock('../../../../../components/Calendar/EventModal/components/TagField', () => ({
    TagField: () => <div data-testid="tag-field">TagField</div>,
}));
vi.mock('../../../../../components/Calendar/EventModal/components/RecurrenceField', () => ({
    RecurrenceField: () => <div data-testid="recurrence-field">RecurrenceField</div>,
}));
vi.mock('../../../../../components/Calendar/EventModal/components/TimeRow', () => ({
    TimeRow: () => <div data-testid="time-row">TimeRow</div>,
}));
vi.mock('../../../../../components/Calendar/EventModal/components/ActionButtons', () => ({
    ActionButtons: () => <div data-testid="action-buttons">ActionButtons</div>,
}));
vi.mock('../../../../../components/Calendar/EventModal/components/ReminderField', () => ({
    ReminderField: () => <div data-testid="reminder-field">ReminderField</div>,
}));

describe('EventFormBody', () => {
    const defaultForm = {
        title: '',
        description: '',
        tag: '',
        is_private: false,
        location: '',
        recurrence: null,
        reminder: null,
    };

    it('renders form with Public and Private visibility toggle', () => {
        const setForm = vi.fn();
        render(<EventFormBody form={defaultForm} setForm={setForm} isEditing={false} onSubmit={() => {}} />);
        expect(screen.getByText('🌐 Public')).toBeInTheDocument();
        expect(screen.getByText('🔒 Private')).toBeInTheDocument();
    });

    it('calls setForm with is_private false when Public clicked', () => {
        const setForm = vi.fn();
        render(<EventFormBody form={{ ...defaultForm, is_private: true }} setForm={setForm} isEditing={false} onSubmit={() => {}} />);
        fireEvent.click(screen.getByText('🌐 Public'));
        expect(setForm).toHaveBeenCalledWith(expect.any(Function));
        const updater = setForm.mock.calls[0][0];
        expect(updater({ is_private: true }).is_private).toBe(false);
    });

    it('calls setForm with is_private true when Private clicked', () => {
        const setForm = vi.fn();
        render(<EventFormBody form={defaultForm} setForm={setForm} isEditing={false} onSubmit={() => {}} />);
        fireEvent.click(screen.getByText('🔒 Private'));
        expect(setForm).toHaveBeenCalledWith(expect.any(Function));
        const updater = setForm.mock.calls[0][0];
        expect(updater({ is_private: false }).is_private).toBe(true);
    });

    it('applies active class to Public when not private', () => {
        render(<EventFormBody form={defaultForm} setForm={vi.fn()} isEditing={false} onSubmit={() => {}} />);
        const publicBtn = screen.getByText('🌐 Public').closest('button');
        expect(publicBtn).toHaveClass('active');
    });

    it('applies active class to Private when is_private true', () => {
        render(<EventFormBody form={{ ...defaultForm, is_private: true }} setForm={vi.fn()} isEditing={false} onSubmit={() => {}} />);
        const privateBtn = screen.getByText('🔒 Private').closest('button');
        expect(privateBtn).toHaveClass('active');
    });

    it('does not render ReminderField when showReminder is false', () => {
        render(<EventFormBody form={defaultForm} setForm={vi.fn()} isEditing={false} onSubmit={() => {}} showReminder={false} />);
        expect(screen.queryByTestId('reminder-field')).not.toBeInTheDocument();
    });

    it('renders ReminderField when showReminder is true (default)', () => {
        render(<EventFormBody form={defaultForm} setForm={vi.fn()} isEditing={false} onSubmit={() => {}} />);
        expect(screen.getByTestId('reminder-field')).toBeInTheDocument();
    });

    it('calls onSubmit on form submit', () => {
        const onSubmit = vi.fn();
        render(<EventFormBody form={defaultForm} setForm={vi.fn()} isEditing={false} onSubmit={onSubmit} />);
        const form = screen.getByText('🌐 Public').closest('form');
        fireEvent.submit(form);
        expect(onSubmit).toHaveBeenCalled();
    });
});
