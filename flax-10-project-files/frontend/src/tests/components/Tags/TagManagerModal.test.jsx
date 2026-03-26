import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TagManagerModal from '../../../components/tags/TagManagerModal';

vi.mock('../../../context/TagContext', () => ({
    useTags: vi.fn(() => ({
        tags: [
            { id: 1, label: 'Work', color: '#ff0000', icon: '💼' },
            { id: 2, label: 'other', color: '#00ff00', icon: '⭐' },
        ],
        addTag: vi.fn(),
        updateTag: vi.fn(),
        deleteTag: vi.fn(),
    })),
}));

vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(() => vi.fn().mockResolvedValue(true)),
}));


import { useTags } from '../../../context/TagContext';
import { useConfirm } from '../../../context/ConfirmContext';

describe('TagManagerModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTags.mockReturnValue({
            tags: [
                { id: 1, label: 'Work', color: '#ff0000', icon: '💼' },
                { id: 2, label: 'other', color: '#00ff00', icon: '⭐' },
            ],
            addTag: vi.fn(),
            updateTag: vi.fn(),
            deleteTag: vi.fn(),
        });
    });

    it('renders Manage Tags title', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        expect(screen.getByText('Manage Tags')).toBeTruthy();
    });

    it('renders tag list', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        expect(screen.getByText('Work')).toBeTruthy();
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(<TagManagerModal onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked', () => {
        const onClose = vi.fn();
        render(<TagManagerModal onClose={onClose} />);
        const overlay = document.querySelector('[class*="backdrop"]');
        fireEvent.mouseDown(overlay);
        expect(onClose).toHaveBeenCalled();
    });

    it('does not close when modal body is clicked', () => {
        const onClose = vi.fn();
        render(<TagManagerModal onClose={onClose} />);
        fireEvent.click(screen.getByText('Manage Tags'));
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders Add New Tag button', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        expect(screen.getByText('+ Add New Tag')).toBeTruthy();
    });

    it('shows tag form when Add New Tag is clicked', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        expect(screen.getByText('Save')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('returns to list when Cancel is clicked from add form', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.getByText('+ Add New Tag')).toBeTruthy();
    });

    it('shows tag edit form when edit button is clicked', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        const editBtns = screen.getAllByRole('button', { name: /edit tag/i });
        fireEvent.click(editBtns[0]);
        expect(screen.getByText('Save')).toBeTruthy();
    });

    it('shows delete button for non-protected tags', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        // Only non-protected tags have an enabled delete button
        const deleteBtns = screen.getAllByRole('button', { name: /delete tag/i }).filter(b => !b.disabled);
        expect(deleteBtns.length).toBeGreaterThanOrEqual(1);
    });

    it('does not show delete button for protected tags (other)', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        // 'other' is protected so its delete button is disabled. Only 'Work' has an enabled delete button.
        const enabledDeleteBtns = screen.getAllByRole('button', { name: /delete tag/i }).filter(b => !b.disabled);
        expect(enabledDeleteBtns.length).toBe(1);
    });

    it('calls deleteTag when delete button is clicked', async () => {
        const mockDeleteTag = vi.fn();
        useTags.mockReturnValue({
            tags: [{ id: 1, label: 'Work', color: '#ff0000', icon: '💼' }],
            addTag: vi.fn(),
            updateTag: vi.fn(),
            deleteTag: mockDeleteTag,
        });
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /delete tag/i }));
        await waitFor(() => expect(mockDeleteTag).toHaveBeenCalledWith(1));
    });

    it('shows validation error when saving without name', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        fireEvent.click(screen.getByText('Save'));
        expect(screen.getByText('Name is required.')).toBeTruthy();
    });

    it('shows name input and color input in add form', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        expect(screen.getByPlaceholderText('e.g. Gym')).toBeTruthy();
        expect(document.querySelector('input[type="color"]')).toBeTruthy();
    });

    it('shows color field in add form', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        expect(document.querySelector('input[type="color"]')).toBeTruthy();
    });

    it('save and cancel buttons are present in add form', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        expect(screen.getByText('Save')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('label is disabled for protected tags', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        const editBtns = screen.getAllByRole('button', { name: /edit tag/i });
        // Click edit on 'other' (protected)
        fireEvent.click(editBtns[1]);
        const input = screen.getByPlaceholderText('e.g. Gym');
        expect(input.disabled).toBe(true);
    });

    it('shows no error when name is set', () => {
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        const nameInput = screen.getByPlaceholderText('e.g. Gym');
        fireEvent.change(nameInput, { target: { value: 'Test' } });
        fireEvent.click(screen.getByText('Save'));
        expect(screen.queryByText('Name is required.')).toBeNull();
    });

    it('calls addTag when saving new tag with valid name', async () => {
        const mockAddTag = vi.fn();
        useTags.mockReturnValue({
            tags: [{ id: 1, label: 'Work', color: '#ff0000', icon: '💼' }],
            addTag: mockAddTag,
            updateTag: vi.fn(),
            deleteTag: vi.fn(),
        });
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        fireEvent.change(screen.getByPlaceholderText('e.g. Gym'), { target: { value: 'Gym' } });
        fireEvent.click(screen.getByText('Save'));
        await waitFor(() => expect(mockAddTag).toHaveBeenCalledWith(expect.objectContaining({ label: 'Gym' })));
    });

    it('calls updateTag when saving edited tag', async () => {
        const mockUpdateTag = vi.fn();
        useTags.mockReturnValue({
            tags: [{ id: 1, label: 'Work', color: '#ff0000', icon: '💼' }],
            addTag: vi.fn(),
            updateTag: mockUpdateTag,
            deleteTag: vi.fn(),
        });
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getAllByRole('button', { name: /edit tag/i })[0]);
        fireEvent.change(screen.getByPlaceholderText('e.g. Gym'), { target: { value: 'Work Updated' } });
        fireEvent.click(screen.getByText('Save'));
        await waitFor(() => expect(mockUpdateTag).toHaveBeenCalledWith(1, expect.objectContaining({ label: 'Work Updated' })));
    });

    it('does not call deleteTag when user cancels delete confirmation', async () => {
        const mockDeleteTag = vi.fn();
        useConfirm.mockReturnValue(vi.fn().mockResolvedValue(false));
        useTags.mockReturnValue({
            tags: [{ id: 1, label: 'Work', color: '#ff0000', icon: '💼' }],
            addTag: vi.fn(),
            updateTag: vi.fn(),
            deleteTag: mockDeleteTag,
        });
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /delete tag/i }));
        await waitFor(() => expect(useConfirm).toHaveBeenCalled());
        expect(mockDeleteTag).not.toHaveBeenCalled();
    });

    it('on duplicate name offers replace and calls updateTag when confirmed', async () => {
        const mockUpdateTag = vi.fn();
        useConfirm.mockReturnValue(vi.fn().mockResolvedValue(true));
        useTags.mockReturnValue({
            tags: [
                { id: 1, label: 'Work', color: '#ff0000', icon: '💼' },
                { id: 2, label: 'Other', color: '#00ff00', icon: '⭐' },
            ],
            addTag: vi.fn(),
            updateTag: mockUpdateTag,
            deleteTag: vi.fn(),
        });
        render(<TagManagerModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add New Tag'));
        fireEvent.change(screen.getByPlaceholderText('e.g. Gym'), { target: { value: 'Work' } });
        fireEvent.click(screen.getByText('Save'));
        await waitFor(() => expect(mockUpdateTag).toHaveBeenCalledWith(1, expect.objectContaining({ label: 'Work' })));
    });
});
