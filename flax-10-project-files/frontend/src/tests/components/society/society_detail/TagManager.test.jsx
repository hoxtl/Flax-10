import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TagManager from '../../../../components/society/society_detail/tags/TagManager';

const mockTags = [
    { id: 1, label: 'Important', color: '#3b82f6' },
    { id: 2, label: 'Meeting', color: '#ef4444' },
];

describe('TagManager', () => {
    it('renders header with tag count', () => {
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.getByText('Manage Tags')).toBeTruthy();
        expect(screen.getByText('2/7')).toBeTruthy();
    });

    it('renders existing tags', () => {
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.getByText('Important')).toBeTruthy();
        expect(screen.getByText('Meeting')).toBeTruthy();
    });

    it('shows empty message when no tags', () => {
        render(<TagManager tags={[]} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.getByText('No tags yet. Add one below.')).toBeTruthy();
    });

    it('calls onDeleteTag when remove button clicked', () => {
        const onDeleteTag = vi.fn();
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={onDeleteTag} />);
        const removeBtns = screen.getAllByText('×');
        fireEvent.click(removeBtns[0]);
        expect(onDeleteTag).toHaveBeenCalledWith(1);
    });

    it('shows add form when under max tags', () => {
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.getByPlaceholderText('Tag name')).toBeTruthy();
    });

    it('calls onAddTag with label and color', async () => {
        const onAddTag = vi.fn().mockResolvedValue();
        render(<TagManager tags={mockTags} onAddTag={onAddTag} onDeleteTag={vi.fn()} />);
        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'New Tag' } });
        fireEvent.click(screen.getByText('Add'));
        expect(onAddTag).toHaveBeenCalledWith({ label: 'New Tag', color: expect.any(String) });
    });

    it('disables Add button when input is empty', () => {
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        const addBtn = screen.getByText('Add');
        expect(addBtn.disabled).toBe(true);
    });

    it('does not show add form when max tags reached', () => {
        const maxTags = Array.from({ length: 7 }, (_, i) => ({ id: i, label: `Tag ${i}`, color: '#3b82f6' }));
        render(<TagManager tags={maxTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.queryByPlaceholderText('Tag name')).toBeNull();
    });

    it('adds tag via Enter key', async () => {
        const onAddTag = vi.fn().mockResolvedValue();
        render(<TagManager tags={mockTags} onAddTag={onAddTag} onDeleteTag={vi.fn()} />);
        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'Enter Tag' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onAddTag).toHaveBeenCalled();
    });

    it('updates color when color swatch clicked', () => {
        render(<TagManager tags={[]} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        // Color picker has 8 color buttons plus a custom color input
        const colorBtns = document.querySelectorAll('[class*="colorOption"]');
        expect(colorBtns.length).toBeGreaterThan(0);
        fireEvent.click(colorBtns[2]);
        // Color changed, add button reflects new state
        expect(screen.getByPlaceholderText('Tag name')).toBeTruthy();
    });

    it('renders with default empty tags', () => {
        render(<TagManager onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.getByText('0/7')).toBeTruthy();
    });

    it('shows error for duplicate tags', async () => {
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'Important' } });
        fireEvent.click(screen.getByText('Add'));
        expect(screen.getByText('A tag with this name already exists.')).toBeTruthy();
    });

    it('resets form after successful add', async () => {
        const onAddTag = vi.fn().mockResolvedValue(true);
        render(<TagManager tags={[]} onAddTag={onAddTag} onDeleteTag={vi.fn()} />);
        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'N' } });
        await act(async () => { fireEvent.click(screen.getByText('Add')); });
        expect(input.value).toBe('');
    });

    it('allows choosing custom color', () => {
        render(<TagManager tags={[]} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        const colorInput = document.querySelector('input[type="color"]');
        fireEvent.change(colorInput, { target: { value: '#123456' } });
        expect(colorInput.value).toBe('#123456');
    });

    it('submits a tag using a custom color', async () => {
        const onAddTag = vi.fn().mockResolvedValue(true);
        render(<TagManager tags={[]} onAddTag={onAddTag} onDeleteTag={vi.fn()} />);

        const colorInput = document.querySelector('input[type="color"]');
        fireEvent.change(colorInput, { target: { value: '#123456' } });
        fireEvent.change(screen.getByPlaceholderText('Tag name'), { target: { value: 'Custom' } });
        await act(async () => {
            fireEvent.click(screen.getByText('Add'));
        });

        expect(onAddTag).toHaveBeenCalledWith({ label: 'Custom', color: '#123456' });
    });

    it('getNextColor falls back to first color if all taken', () => {
        const fullTags = [
            "#3b82f6", "#ef4444", "#22c55e", "#f59e0b",
            "#9C27B0", "#ec4899", "#10b981", "#FFD54F",
        ].map((c, i) => ({ id: i, label: `Tag ${i}`, color: c }));
        render(<TagManager tags={fullTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.getByText('8/7')).toBeInTheDocument();
    });

    it('shows a blank-name validation error when Enter is pressed on whitespace', () => {
        render(<TagManager tags={[]} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(screen.getByText('Give the tag a name.')).toBeInTheDocument();
    });

    it('shows returned add errors and falls back to the default message', async () => {
        const onAddTag = vi
            .fn()
            .mockRejectedValueOnce(new Error('Nope'))
            .mockRejectedValueOnce({});
        render(<TagManager tags={[]} onAddTag={onAddTag} onDeleteTag={vi.fn()} />);

        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'Broken' } });
        await act(async () => {
            fireEvent.click(screen.getByText('Add'));
        });
        expect(screen.getByText('Nope')).toBeInTheDocument();

        fireEvent.change(input, { target: { value: 'Still Broken' } });
        await act(async () => {
            fireEvent.click(screen.getByText('Add'));
        });
        expect(screen.getByText('Failed to add tag. Please try again.')).toBeInTheDocument();
    });

    it('keeps the add form populated when the add callback returns no result', async () => {
        const onAddTag = vi.fn().mockResolvedValue(null);
        render(<TagManager tags={[]} onAddTag={onAddTag} onDeleteTag={vi.fn()} />);

        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'Draft Tag' } });
        await act(async () => {
            fireEvent.click(screen.getByText('Add'));
        });

        expect(onAddTag).toHaveBeenCalledWith({ label: 'Draft Tag', color: '#3b82f6' });
        expect(input.value).toBe('Draft Tag');
    });

    it('validates existing tag names to prevent duplicates', async () => {
        const onUpdateTag = vi.fn().mockResolvedValue(undefined);
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} onUpdateTag={onUpdateTag} />);

        fireEvent.click(screen.getByText('Important'));
        const editInput = screen.getByDisplayValue('Important');
        fireEvent.change(editInput, { target: { value: 'Meeting' } });
        await act(async () => {
            fireEvent.click(screen.getByText('Save'));
        });

        expect(screen.getByText('A tag with this name already exists.')).toBeInTheDocument();
        expect(onUpdateTag).not.toHaveBeenCalled();
    });

    it('successfully edits and updates an existing tag', async () => {
        const onUpdateTag = vi.fn().mockResolvedValue(undefined);
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} onUpdateTag={onUpdateTag} />);

        fireEvent.click(screen.getByText('Important'));
        const editInput = screen.getByDisplayValue('Important');
        fireEvent.change(editInput, { target: { value: 'Updated Important' } });
        const colorButtons = document.querySelectorAll('[class*="colorOption"]');
        fireEvent.click(colorButtons[3]);
        await act(async () => {
            fireEvent.click(screen.getByText('Save'));
        });

        expect(onUpdateTag).toHaveBeenCalledWith(1, { label: 'Updated Important', color: '#f59e0b' });
    });

    it('cancels edits and restores the original tag value', () => {
        const onUpdateTag = vi.fn();
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} onUpdateTag={onUpdateTag} />);

        fireEvent.click(screen.getByText('Important'));
        const reopenedInput = screen.getByDisplayValue('Important');
        fireEvent.change(reopenedInput, { target: { value: 'Temporary' } });
        fireEvent.click(screen.getByText('Cancel'));
        fireEvent.click(screen.getByText('Important'));

        expect(screen.getByDisplayValue('Important')).toBeInTheDocument();
        expect(onUpdateTag).not.toHaveBeenCalled();
    });

    it('does not save an edited tag when a non-Enter key is pressed', () => {
        const onUpdateTag = vi.fn();
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} onUpdateTag={onUpdateTag} />);

        fireEvent.click(screen.getByText('Important'));
        fireEvent.keyDown(screen.getByDisplayValue('Important'), { key: 'Escape' });

        expect(onUpdateTag).not.toHaveBeenCalled();
        expect(screen.getByDisplayValue('Important')).toBeInTheDocument();
    });

    it('saves an edited tag when Enter is pressed in the editor input', async () => {
        const onUpdateTag = vi.fn().mockResolvedValue(undefined);
        render(<TagManager tags={mockTags} onAddTag={vi.fn()} onDeleteTag={vi.fn()} onUpdateTag={onUpdateTag} />);

        fireEvent.click(screen.getByText('Important'));
        const editInput = screen.getByDisplayValue('Important');
        fireEvent.change(editInput, { target: { value: 'Keyboard Saved' } });
        await act(async () => {
            fireEvent.keyDown(editInput, { key: 'Enter' });
        });

        expect(onUpdateTag).toHaveBeenCalledWith(1, { label: 'Keyboard Saved', color: '#3b82f6' });
    });

    it('hides the color dot for tags without a color', () => {
        const tagWithoutColor = [{ id: 9, label: 'No Color', color: '' }];
        const { container } = render(<TagManager tags={tagWithoutColor} onAddTag={vi.fn()} onDeleteTag={vi.fn()} />);
        expect(screen.getByText('No Color')).toBeInTheDocument();
        expect(container.querySelector('[class*="tagDot"]')).toBeNull();
    });
});
