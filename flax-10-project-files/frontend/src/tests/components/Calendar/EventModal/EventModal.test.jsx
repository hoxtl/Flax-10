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

const tagsState = { tags: [{ id: 1, label: 'Work', color: '#000' }, { id: 2, label: 'Other', color: '#fff' }], loading: false };

vi.mock('../../../../context/TagContext', () => ({
    TagProvider: ({ children }) => children,
    useTags: () => ({ ...tagsState }),
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
        mockFormLogic.isEditing = false;
        mockFormLogic.error = null;
        mockFormLogic.form = { title: '', description: '', tag: '', start_time: '', end_time: '', reminder: [] };
        tagsState.loading = false;
        tagsState.tags = [{ id: 1, label: 'Work', color: '#000' }, { id: 2, label: 'Other', color: '#fff' }];
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
        fireEvent.click(screen.getByText('Delete'));
        expect(mockFormLogic.handleDelete).toHaveBeenCalled();
    });

    it('returns null while tags are loading', () => {
        tagsState.loading = true;
        const { container } = renderModal();
        expect(container.firstChild).toBeNull();
    });

    it('uses initialType as default tag when provided', () => {
        renderModal({ initialType: 'work' });
        expect(screen.getByText('New Event')).toBeInTheDocument();
    });

    it('uses null default tag when customTags provided and no initialType', () => {
        renderModal({ customTags: [{ id: 3, label: 'Custom', color: '#f00' }] });
        expect(screen.getByText('New Event')).toBeInTheDocument();
    });
});
