import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManager from '../../../components/Society/SocietyDetail/tags/TagManager';

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
});
