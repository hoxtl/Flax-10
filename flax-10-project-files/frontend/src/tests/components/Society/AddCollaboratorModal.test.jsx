import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddCollaboratorModal from '../../../components/Society/AddCollaboratorModal';

vi.mock('../../../api/userService', () => ({
    searchUsers: vi.fn(),
}));

import { searchUsers } from '../../../api/userService';

describe('AddCollaboratorModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        searchUsers.mockResolvedValue({
            results: [
                { id: 1, username: 'alice' },
                { id: 2, username: 'bob' },
            ],
        });
    });

    it('renders Add Collaborators title', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        expect(screen.getByText('Add Collaborators')).toBeTruthy();
    });

    it('renders search input', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        expect(screen.getByPlaceholderText('Search by username...')).toBeTruthy();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<AddCollaboratorModal onClose={onClose} onAdd={vi.fn()} />);
        const closeBtn = screen.getAllByRole('button').find(b => b.textContent === '×');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel is clicked', () => {
        const onClose = vi.fn();
        render(<AddCollaboratorModal onClose={onClose} onAdd={vi.fn()} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Add button is disabled initially (no users selected)', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        expect(screen.getByText('Add').closest('button')).toBeDisabled();
    });

    it('does not search when query is less than 2 characters', async () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'a' } });
        await waitFor(() => {
            expect(searchUsers).not.toHaveBeenCalled();
        });
    });

    it('searches when query is 2+ characters', async () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'al' } });
        await waitFor(() => {
            expect(searchUsers).toHaveBeenCalledWith('al');
        });
    });

    it('shows search results', async () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'al' } });
        await waitFor(() => {
            expect(screen.getByText('alice')).toBeTruthy();
        });
    });

    it('filters out existing usernames from results', async () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} existingUsernames={['alice']} />);
        fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'al' } });
        await waitFor(() => {
            expect(screen.queryByText('alice')).toBeNull();
            expect(screen.getByText('bob')).toBeTruthy();
        });
    });

    it('adds user to selection when clicked', async () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'al' } });
        await waitFor(() => {
            expect(screen.getByText('alice')).toBeTruthy();
        });
        fireEvent.click(screen.getByText('alice'));
        // alice should now appear as a chip
        const chips = screen.getAllByText('alice');
        expect(chips.length).toBeGreaterThan(0);
        // Add button should now be enabled
        expect(screen.getByText('Add').closest('button')).not.toBeDisabled();
    });

    it('calls onAdd and onClose when Add is clicked with selected users', async () => {
        const onAdd = vi.fn();
        const onClose = vi.fn();
        render(<AddCollaboratorModal onClose={onClose} onAdd={onAdd} />);
        fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'al' } });
        await waitFor(() => screen.getByText('alice'));
        fireEvent.click(screen.getByText('alice'));
        fireEvent.click(screen.getByText('Add'));
        expect(onAdd).toHaveBeenCalledWith([{ id: 1, username: 'alice' }]);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('handles search error gracefully', async () => {
        searchUsers.mockRejectedValueOnce(new Error('Network error'));
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText('Search by username...'), { target: { value: 'al' } });
        await waitFor(() => {
            expect(searchUsers).toHaveBeenCalled();
        });
        // No crash, just empty results
        expect(screen.queryByText('alice')).toBeNull();
    });
});
