import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeadlineModal from '../../../components/Modules/DeadlineModal';

// Const values for the test Modal
const mockModal = {
    deadlines: [],
    showForm: false,
    editing: null,
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    handleSubmit: vi.fn(),
    handleDelete: vi.fn(),
    close: vi.fn(),
};

vi.mock('../../../components/Modules/hooks/useDeadlineModal', () => ({
    useDeadlineModal: () => mockModal,
}));

vi.mock('../../../components/Modules/DeadlineForm', () => ({
    default: ({ onCancel }) => <div><button onClick={onCancel}>Cancel</button></div>,
}));

vi.mock('../../../components/Modules/DeadlineCard', () => ({
    default: ({ deadline, onEdit, onDelete }) => (
        <div>
            <span>{deadline.title}</span>
            <button onClick={onEdit}>Edit</button>
            <button onClick={onDelete}>Delete</button>
        </div>
    ),
}));

vi.mock('../../../components/Modules/DeadlineModal.module.css', () => ({ default: {} }));

const module = { id: 1, module_code: '5CCS2SEG' };

describe('DeadlineModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockModal.showForm = false;
        mockModal.deadlines = [];
    });

    it('should successfully render module code in header', () => {
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText(/5CCS2SEG/)).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<DeadlineModal module={module} onClose={onClose} />);
        fireEvent.click(screen.getByText('×'));
        expect(onClose).toHaveBeenCalled();
    });

    it('should render empty message when there are no deadlines', () => {
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('No deadlines yet.')).toBeInTheDocument();
    });

    it('should render deadline cards when deadlines exist', () => {
        mockModal.deadlines = [{ id: 1, title: 'Small Group Project', deadline_type: 'coursework', start_due_date: '2026-03-01' }];
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('Small Group Project')).toBeInTheDocument();
    });

    it('should call openCreate when add button clicked', () => {
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add Deadline'));
        expect(mockModal.openCreate).toHaveBeenCalled();
    });

    it('should render form when showForm is true', () => {
        mockModal.showForm = true;
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call close when form cancel clicked', () => {
        mockModal.showForm = true;
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockModal.close).toHaveBeenCalled();
    });

    it('should call onClose when overlay is clicked', () => {
        const onClose = vi.fn();
        const { container } = render(<DeadlineModal module={module} onClose={onClose} />);
        fireEvent.click(container.firstChild);
        expect(onClose).toHaveBeenCalled();
    });

    it('should NOT call onClose when content area is clicked (stopPropagation)', () => {
        const onClose = vi.fn();
        render(<DeadlineModal module={module} onClose={onClose} />);
        fireEvent.click(screen.getByText(/5CCS2SEG/));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('should call openEdit when edit button on a card is clicked', () => {
        mockModal.deadlines = [{ id: 1, title: 'Assignment 1', deadline_type: 'coursework', start_due_date: '2026-03-01' }];
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Edit'));
        expect(mockModal.openEdit).toHaveBeenCalledWith(mockModal.deadlines[0]);
    });

    it('should call handleDelete when delete button on a card is clicked', () => {
        mockModal.deadlines = [{ id: 1, title: 'Assignment 1', deadline_type: 'coursework', start_due_date: '2026-03-01' }];
        render(<DeadlineModal module={module} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Delete'));
        expect(mockModal.handleDelete).toHaveBeenCalledWith(1);
    });
});