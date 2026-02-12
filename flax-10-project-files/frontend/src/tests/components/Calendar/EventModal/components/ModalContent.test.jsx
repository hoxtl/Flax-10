import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModalContent } from '../../../../../components/Calendar/EventModal/components/ModalContent';

// Mock child components to isolate ModalContent logic
vi.mock('../../../../../components/Calendar/EventModal/components/ModalHeader', () => ({
    ModalHeader: ({ onClose }) => <div data-testid="modal-header"><button onClick={onClose}>Close</button></div>
}));
vi.mock('../../../../../components/Calendar/EventModal/components/EventFormBody', () => ({
    EventFormBody: ({ onSubmit }) => <form data-testid="event-form" onSubmit={onSubmit}><button>Submit</button></form>
}));

describe('ModalContent', () => {
    const defaultProps = {
        onClose: vi.fn(),
        isEditing: false,
        form: {},
        setForm: vi.fn(),
        error: null,
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        overlapWarning: null,
        handleConfirmSave: vi.fn(),
        handleCancelSave: vi.fn(),
    };

    it('should render event form view when no overlap warning', () => {
        render(<ModalContent {...defaultProps} />);
        expect(screen.getByTestId('event-form')).toBeInTheDocument();
        expect(screen.queryByText('Scheduling Conflict')).not.toBeInTheDocument();
    });

    it('should show error message if error prop provided', () => {
        render(<ModalContent {...defaultProps} error="Something went wrong" />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render overlap warning view when warning exists', () => {
        const warning = [
            { id: 1, title: 'Overlap 1', start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00' },
            { id: 2, title: 'Overlap 2', start_time: '2025-01-01T10:30:00', end_time: '2025-01-01T11:30:00' }
        ];
        render(<ModalContent {...defaultProps} overlapWarning={warning} />);

        expect(screen.getByText('⚠️ Scheduling Conflict')).toBeInTheDocument();
        expect(screen.getByText('Overlap 1')).toBeInTheDocument();
        expect(screen.getByText('Overlap 2')).toBeInTheDocument();

        // Check actions
        expect(screen.getByText('Save Anyway')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call handleConfirmSave when confirmed', () => {
        const warning = [{ id: 1, title: 'Overlap', start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00' }];
        render(<ModalContent {...defaultProps} overlapWarning={warning} />);

        fireEvent.click(screen.getByText('Save Anyway'));
        expect(defaultProps.handleConfirmSave).toHaveBeenCalled();
    });

    it('should call handleCancelSave when cancelled', () => {
        const warning = [{ id: 1, title: 'Overlap', start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00' }];
        render(<ModalContent {...defaultProps} overlapWarning={warning} />);

        fireEvent.click(screen.getByText('Cancel'));
        expect(defaultProps.handleCancelSave).toHaveBeenCalled();
    });

    it('should close warning view via header close button', () => {
        const warning = [{ id: 1, title: 'Overlap', start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00' }];
        render(<ModalContent {...defaultProps} overlapWarning={warning} />);

        fireEvent.click(screen.getByText('×')); // The close button in ModalHeaderWarning
        expect(defaultProps.handleCancelSave).toHaveBeenCalled();
    });

    it('should stop propagation on click', () => {
        const onClick = vi.fn();
        render(<div onClick={onClick}><ModalContent {...defaultProps} /></div>);
        fireEvent.click(screen.getByTestId('event-form').parentElement); // Click the modal content div
        expect(onClick).not.toHaveBeenCalled();
    });

    it('should stop propagation on click in warning view', () => {
        const onClick = vi.fn();
        const warning = [{ id: 1, title: 'Overlap', start_time: '2025-01-01T10:00:00', end_time: '2025-01-01T11:00:00' }];
        render(<div onClick={onClick}><ModalContent {...defaultProps} overlapWarning={warning} /></div>);
        fireEvent.click(screen.getByText('⚠️ Scheduling Conflict').parentElement.parentElement);
        expect(onClick).not.toHaveBeenCalled();
    });
});
