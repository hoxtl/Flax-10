import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventFormBody } from '../../../../../components/calendar/event_modal/components/EventFormBody';

vi.mock('../../../../../components/calendar/event_modal/components/FormField', () => ({
    FormField: ({ label, value, onChange }) => (
        <div data-testid={`field-${label}`}>
            <label>{label}</label>
            <input value={value || ''} onChange={(e) => onChange && onChange(e)} aria-label={label} />
        </div>
    ),
}));
vi.mock('../../../../../components/calendar/event_modal/components/TagField', () => ({
    TagField: () => <div data-testid="tag-field">TagField</div>,
}));
vi.mock('../../../../../components/calendar/event_modal/components/RecurrenceField', () => ({
    RecurrenceField: ({ onChange }) => (
        <button type="button" data-testid="recurrence-field" onClick={() => onChange({ frequency: 'monthly' })}>
            RecurrenceField
        </button>
    ),
}));
vi.mock('../../../../../components/calendar/event_modal/components/TimeRow', () => ({
    TimeRow: ({ onRecurrenceChange }) => (
        <button type="button" data-testid="time-row" onClick={() => onRecurrenceChange({ frequency: 'weekly' })}>
            TimeRow
        </button>
    ),
}));
vi.mock('../../../../../components/calendar/event_modal/components/ActionButtons', () => ({
    ActionButtons: () => <div data-testid="action-buttons">ActionButtons</div>,
}));
vi.mock('../../../../../components/calendar/event_modal/components/ReminderField', () => ({
    ReminderField: ({ onChange }) => (
        <button type="button" data-testid="reminder-field" onClick={() => onChange(30)}>
            ReminderField
        </button>
    ),
}));
vi.mock('../../../../../components/calendar/event_modal/components/LocationAutoComplete', () => ({
    LocationAutocomplete: ({ onChange }) => (
        <button type="button" data-testid="location-field" onClick={() => onChange('Strand Campus')}>
            LocationAutocomplete
        </button>
    ),
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

    it('updates location, recurrence, and reminder fields through setForm', () => {
        const setForm = vi.fn();
        render(<EventFormBody form={defaultForm} setForm={setForm} isEditing={false} onSubmit={() => {}} />);

        fireEvent.click(screen.getByTestId('location-field'));
        fireEvent.click(screen.getByTestId('time-row'));
        fireEvent.click(screen.getByTestId('recurrence-field'));
        fireEvent.click(screen.getByTestId('reminder-field'));

        expect(setForm.mock.calls[0][0]({ location: '' }).location).toBe('Strand Campus');
        expect(setForm.mock.calls[1][0]({ recurrence: null }).recurrence).toEqual({ frequency: 'weekly' });
        expect(setForm.mock.calls[2][0]({ recurrence: null }).recurrence).toEqual({ frequency: 'monthly' });
        expect(setForm.mock.calls[3][0]({ reminder: null }).reminder).toBe(30);
    });
});
