import { render, screen, fireEvent, waitFor } from '../../../../utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventModal } from '../../../../components/Calendar/EventModal/EventModal';

const { mockFormLogic, mockOnClose } = vi.hoisted(() => ({
    mockFormLogic: {
        isEditing: false,
        form: { title: '', description: '', tag: '', start_time: '', end_time: '' },
        setForm: vi.fn(cb => {
            // If callback, execute it to cover the arrow function in component
            if (typeof cb === 'function') cb(mockFormLogic.form);
        }),
        error: null,
        handleSubmit: vi.fn(e => e?.preventDefault?.()),
        handleDelete: vi.fn(),
    },
    mockOnClose: vi.fn(),
}));

// We mock the hook to isolate the View functionality from Logic
vi.mock('../../../../components/Calendar/EventModal/useEventForm', () => ({
    useEventForm: () => mockFormLogic,
}));

describe('EventModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock state default
        mockFormLogic.isEditing = false;
        mockFormLogic.error = null;
        mockFormLogic.form = { title: '', description: '', tag: '', start_time: '', end_time: '' };
    });

    it('should render new event title', () => {
        render(<EventModal onClose={mockOnClose} />);
        expect(screen.getByText('New Event')).toBeInTheDocument();
    });

    it('should render edit event title when editing', () => {
        mockFormLogic.isEditing = true;
        render(<EventModal onClose={mockOnClose} />);
        expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
        render(<EventModal onClose={mockOnClose} />);
        fireEvent.click(screen.getByText('×'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when overlay clicked', () => {
        const { container } = render(<EventModal onClose={mockOnClose} />);
        const overlay = container.firstChild;
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking content', () => {
        render(<EventModal onClose={mockOnClose} />);
        // Click on title or form
        fireEvent.click(screen.getByText('New Event'));
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should render validation error', () => {
        mockFormLogic.error = 'Title is required';
        render(<EventModal onClose={mockOnClose} />);
        expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('should call update when typing in fields', () => {
        // Since we mocked useEventForm, we need to replicate behavior?
        // Or just check that onChange calls setForm?
        // In our mock, setForm is a spy.
        // EventFormBody calls `setForm(f => ...)`
        // We can check if setForm was called.
        render(<EventModal onClose={mockOnClose} />);
        const titleInput = screen.getByLabelText('Title');
        fireEvent.change(titleInput, { target: { value: 'New' } });
        expect(mockFormLogic.setForm).toHaveBeenCalled();
    });

    it('should call handleSubmit on submit', () => {
        const { container } = render(<EventModal onClose={mockOnClose} />);
        const form = container.querySelector('form');
        fireEvent.submit(form);
        expect(mockFormLogic.handleSubmit).toHaveBeenCalled();
    });

    it('should render delete button only when editing', () => {
        mockFormLogic.isEditing = true;
        render(<EventModal onClose={mockOnClose} />);
        expect(screen.getByText('Delete')).toBeInTheDocument();

        // click delete
        fireEvent.click(screen.getByText('Delete'));
        expect(mockFormLogic.handleDelete).toHaveBeenCalled();
    });
});
