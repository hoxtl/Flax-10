import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { EventModal } from '../../../../components/Calendar/EventModal/EventModal';
import { TagProvider } from '../../../../context/TagContext';

const { mockFormLogic } = vi.hoisted(() => ({
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
}));

// We mock the hook to isolate the View functionality from Logic
vi.mock('../../../../components/Calendar/EventModal/useEventForm', () => ({
    useEventForm: () => mockFormLogic,
}));

vi.mock('../../../../context/CalendarContext', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useCalendar: () => ({
            events: [],
            selectedDate: new Date('2024-03-15'),
            viewMode: 'month'
        }),
        useCalendarDispatch: () => vi.fn(),
        useEventModal: () => ({
            closeModal: vi.fn(),
            isModalOpen: true,
            modalEvent: null,
            modalType: 'add'
        }),
    };
});

describe('EventModal', () => {
    const mockOnClose = vi.fn();

    const renderModal = (props = {}) => {
        return render(
            <TagProvider>
                <EventModal onClose={mockOnClose} {...props} />
            </TagProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock state default
        mockFormLogic.isEditing = false;
        mockFormLogic.error = null;
        mockFormLogic.form = { title: '', description: '', tag: '', start_time: '', end_time: '' };
    });

    it('should render new event title', () => {
        renderModal();
        expect(screen.getByText('New Event')).toBeInTheDocument();
    });

    it('should render edit event title when editing', () => {
        mockFormLogic.isEditing = true;
        renderModal();
        expect(screen.getByText('Edit Event')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', () => {
        renderModal();
        fireEvent.click(screen.getByText('×'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when overlay clicked', () => {
        const { container } = renderModal();
        const overlay = container.firstChild;
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking content', () => {
        renderModal();
        // Click on title or form
        fireEvent.click(screen.getByText('New Event'));
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should render validation error', () => {
        mockFormLogic.error = 'Title is required';
        renderModal();
        expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('should call update when typing in fields', () => {
        renderModal();
        const titleInput = screen.getByLabelText('Title');
        fireEvent.change(titleInput, { target: { value: 'New' } });
        expect(mockFormLogic.setForm).toHaveBeenCalled();
    });

    it('should call handleSubmit on submit', () => {
        const { container } = renderModal();
        const form = container.querySelector('form');
        fireEvent.submit(form);
        expect(mockFormLogic.handleSubmit).toHaveBeenCalled();
    });

    it('should render delete button only when editing', () => {
        mockFormLogic.isEditing = true;
        renderModal();
        expect(screen.getByText('Delete')).toBeInTheDocument();

        // click delete
        fireEvent.click(screen.getByText('Delete'));
        expect(mockFormLogic.handleDelete).toHaveBeenCalled();
    });
});
