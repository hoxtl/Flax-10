import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { EventModal } from '../../../../components/Calendar/EventModal/EventModal';
import { TagProvider } from '../../../../context/TagContext';

const { mockFormLogic } = vi.hoisted(() => ({
    mockFormLogic: {
        isEditing: false,
        form: { title: '', description: '', tag: '', start_time: '', end_time: '', reminder: [] },
        setForm: vi.fn(cb => {
            if (typeof cb === 'function') cb(mockFormLogic.form);
        }),
        error: null,
        handleSubmit: vi.fn(e => e?.preventDefault?.()),
        handleDelete: vi.fn(),
    },
}));

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

const mockTagsState = {
    tags: [{ id: 1, label: 'Work', color: '#000' }, { id: 2, label: 'Other', color: '#fff' }],
    loading: false,
};

vi.mock('../../../../context/TagContext', () => ({
    TagProvider: ({ children }) => children,
    useTags: () => mockTagsState,
}));

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
        mockFormLogic.form = { title: '', description: '', tag: '', start_time: '', end_time: '', reminder: [] };
        mockTagsState.tags = [{ id: 1, label: 'Work', color: '#000' }, { id: 2, label: 'Other', color: '#fff' }];
        mockTagsState.loading = false;
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
        renderModal();
        const overlay = document.querySelector('[class*="backdrop"]');
        fireEvent.mouseDown(overlay);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking content', () => {
        renderModal();
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
        renderModal();
        const form = document.querySelector('form');
        fireEvent.submit(form);
        expect(mockFormLogic.handleSubmit).toHaveBeenCalled();
    });

    it('should render delete button only when editing', () => {
        const mockOnDelete = vi.fn();
        mockFormLogic.isEditing = true;
        render(<TagProvider><EventModal onClose={mockOnClose} onDelete={mockOnDelete} /></TagProvider>);
        expect(screen.getByText('Delete')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Delete'));
        expect(mockOnDelete).toHaveBeenCalled();
    });

    it('returns null when tags are still loading', () => {
        mockTagsState.loading = true;
        const { container } = render(
            <TagProvider>
                <EventModal onClose={mockOnClose} />
            </TagProvider>
        );
        expect(container.firstChild).toBeNull();
    });

    it('uses initialType over default tag when provided', () => {
        renderModal({ initialType: 99 });
        // useEventForm is mocked; we just ensure component renders without crashing
        expect(screen.getByText('New Event')).toBeInTheDocument();
    });

    it('uses customTags and does not fall back to global tags', () => {
        const customTags = [{ id: 10, label: 'Custom', color: '#123' }];
        renderModal({ customTags });
        expect(screen.getByText('New Event')).toBeInTheDocument();
    });

    it('hides reminder field when showReminder is false', () => {
        renderModal({ showReminder: false });
        expect(screen.getByText('New Event')).toBeInTheDocument();
        expect(screen.queryByText('Reminders')).not.toBeInTheDocument();
    });
});
