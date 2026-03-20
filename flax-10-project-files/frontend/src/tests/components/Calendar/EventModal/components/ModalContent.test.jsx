import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalContent } from '../../../../../components/Calendar/EventModal/components/ModalContent';

vi.mock('../../../../../components/Calendar/EventModal/components/ModalHeader', () => ({
    ModalHeader: ({ onClose }) => <div data-testid="modal-header"><button onClick={onClose}>Close</button></div>
}));

vi.mock('../../../../../components/Calendar/EventModal/components/EventFormBody', () => ({
    EventFormBody: ({ onSubmit }) => <form data-testid="event-form" onSubmit={onSubmit}><button>Submit</button></form>
}));

describe('ModalContent', () => {
    beforeEach(() => vi.clearAllMocks());

    const defaultProps = {
        onClose: vi.fn(),
        isEditing: false,
        form: {},
        setForm: vi.fn(),
        error: null,
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        sleepWarning: false,
        sleepSettings: { sleepTime: '23:00', wakeTime: '07:00' },
        handleConfirmSleep: vi.fn(),
        handleCancelSleep: vi.fn(),
        overlapWarning: null,
        handleConfirmSave: vi.fn(),
        handleCancelSave: vi.fn(),
    };

    it('should render event form view when no sleep warning', () => {
        render(<ModalContent {...defaultProps} />);
        expect(screen.getByTestId('event-form')).toBeInTheDocument();
        expect(screen.queryByText('Sleep Hours')).not.toBeInTheDocument();
    });

    it('should show error message if error prop provided', () => {
        render(<ModalContent {...defaultProps} error="Something went wrong" />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render sleep warning view when sleepWarning is true', () => {
        render(<ModalContent {...defaultProps} sleepWarning={true} />);

        expect(screen.getByText('You should be resting!')).toBeInTheDocument();
        expect(screen.getByText('Add Anyway')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /cancel — i['’]ll rest/i }),
        ).toBeInTheDocument();
    });

    it('should call handleConfirmSleep when confirmed', () => {
        render(<ModalContent {...defaultProps} sleepWarning={true} />);

        fireEvent.click(screen.getByText('Add Anyway'));
        expect(defaultProps.handleConfirmSleep).toHaveBeenCalled();
    });

    it('should call handleCancelSleep when cancelled', () => {
        render(<ModalContent {...defaultProps} sleepWarning={true} />);

        fireEvent.click(screen.getByRole('button', { name: /cancel — i['’]ll rest/i }));
        expect(defaultProps.handleCancelSleep).toHaveBeenCalled();
    });

    it('should close sleep warning view via header close button', () => {
        render(<ModalContent {...defaultProps} sleepWarning={true} />);

        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(defaultProps.handleCancelSleep).toHaveBeenCalled();
    });

    it('renders form and does not call onClose on form click', () => {
        render(<ModalContent {...defaultProps} />);
        fireEvent.click(screen.getByTestId('event-form'));
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('renders sleep warning and does not call handleConfirmSleep on header click', () => {
        render(<ModalContent {...defaultProps} sleepWarning={true} />);
        // Clicking the modal header (title) should not confirm the sleep warning.
        fireEvent.click(screen.getByText('You should be resting!'));
        expect(defaultProps.handleConfirmSleep).not.toHaveBeenCalled();
    });

    it('renders overlap warning view and wires confirm/cancel', () => {
        const props = {
            ...defaultProps,
            sleepWarning: false,
            overlapWarning: [{ id: 1, title: 'Conflict 1' }],
        };
        render(<ModalContent {...props} />);
        expect(screen.getByText('Scheduling Conflict')).toBeInTheDocument();
        expect(screen.getByText('Conflict 1')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Save Anyway'));
        expect(props.handleConfirmSave).toHaveBeenCalled();
        fireEvent.click(screen.getAllByText('Cancel')[0]);
        expect(props.handleCancelSave).toHaveBeenCalled();
        fireEvent.click(screen.getByText('x'));
        expect(props.handleCancelSave).toHaveBeenCalledTimes(2);
    });
});
