/*
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Society/society_detail/tags/TagManager.test.jsx
 * TagManager.test verifies tag management behaviour in society detail tabs.
 */

=======
 * TagManager.test verifies tag management behavior in society detail tabs.
 */
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Society/SocietyDetail/tags/TagManager.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManager from './TagManager';

describe('TagManager', () => {
    const mockAdd = vi.fn();
    const mockDelete = vi.fn();
    const tags = [{ id: 1, label: 'Sports', color: '#ff0000' }];

    it('shows error when adding duplicate tag', async () => {
        render(<TagManager tags={tags} onAddTag={mockAdd} onDeleteTag={mockDelete} />);
        
        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'sports' } }); // lowercase to test case insensitivity
        fireEvent.click(screen.getByText('Add'));

        expect(screen.getByText('A tag with this name already exists.')).toBeTruthy();
        expect(mockAdd).not.toHaveBeenCalled();
    });

    it('clears error when typing', () => {
        render(<TagManager tags={tags} onAddTag={mockAdd} onDeleteTag={mockDelete} />);
        
        const input = screen.getByPlaceholderText('Tag name');
        fireEvent.change(input, { target: { value: 'sports' } });
        fireEvent.click(screen.getByText('Add'));
        
        expect(screen.queryByText('A tag with this name already exists.')).toBeTruthy();
        
        fireEvent.change(input, { target: { value: 'New Tag' } });
        expect(screen.queryByText('A tag with this name already exists.')).toBeNull();
    });
});
