import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddCollaboratorModal from '../../../../components/society/components/AddCollaboratorModal';

vi.mock('../../../../components/social/components/UserSearch', () => ({
    default: ({ onUserSelect, filterUsers, renderEmptyState }) => {
        // Expose a way to test the filter
        const dummyResults = [
            { id: 1, username: 'alice' },
            { id: 2, username: 'bob' },
            { id: 3, username: 'charlie' }
        ];
        const filtered = filterUsers ? filterUsers(dummyResults) : dummyResults;
        const defaultFiltered = filterUsers ? filterUsers() : [];
        const emptyState = renderEmptyState ? renderEmptyState({ clear: vi.fn(), query: 'nobody' }) : null;

        return (
            <div data-testid="mock-user-search">
                <div data-testid="filtered-results">
                    {filtered.map(u => u.username).join(',')}
                </div>
                <div data-testid="default-filtered-results">
                    {defaultFiltered.map(u => u.username).join(',')}
                </div>
                <div data-testid="custom-empty-state">
                    {renderEmptyState ? 'has-custom-empty-state' : 'no-custom-empty-state'}
                </div>
                <div data-testid="rendered-empty-state">{emptyState}</div>
                <button onClick={() => onUserSelect({ id: 1, username: 'alice' })}>Select Alice</button>
                <button onClick={() => onUserSelect({ id: 2, username: 'bob' })}>Select Bob</button>
                <button onClick={() => onUserSelect({ id: 3, username: 'charlie' })}>Select Charlie</button>
            </div>
        );
    }
}));

describe('AddCollaboratorModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Add Collaborators title', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        expect(screen.getByText('Add Collaborators')).toBeTruthy();
    });

    it('renders UserSearch component', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);
        expect(screen.getByTestId('mock-user-search')).toBeTruthy();
        expect(screen.getByTestId('custom-empty-state').textContent).toBe('has-custom-empty-state');
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(<AddCollaboratorModal onClose={onClose} onAdd={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /close/i }));
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

    it('filters out existing usernames via filterUsers prop', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} existingUsernames={['alice']} />);
        const filteredDiv = screen.getByTestId('filtered-results');
        expect(filteredDiv.textContent).toBe('bob,charlie');
    });

    it('filters out already selected users via filterUsers prop', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);

        // Select bob
        fireEvent.click(screen.getByText('Select Bob'));

        // Bob should no longer be in the filtered results
        const filteredDiv = screen.getByTestId('filtered-results');
        expect(filteredDiv.textContent).toBe('alice,charlie');
    });

    it('adds user to selection when selected from UserSearch', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);

        fireEvent.click(screen.getByText('Select Alice'));

        // alice should now appear as a chip
        const chip = screen.getByText('alice', { selector: 'span' });
        expect(chip).toBeTruthy();

        // Add button should now be enabled
        expect(screen.getByText('Add').closest('button')).not.toBeDisabled();
    });

    it('removes user from selection when chip dismiss clicked', () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);

        fireEvent.click(screen.getByText('Select Alice'));

        const chip = screen.getByText('alice', { selector: 'span' });
        expect(chip).toBeTruthy();

        // Click the remove button inside the chip specifically
        const dismissBtn = chip.querySelector('button');
        fireEvent.click(dismissBtn);

        // The chip should be gone
        expect(screen.queryByText('alice', { selector: 'span' })).toBeNull();
        expect(screen.getByText('Add').closest('button')).toBeDisabled();
    });

    it('calls onAdd and onClose when Add is clicked with selected users', async () => {
        const onAdd = vi.fn();
        const onClose = vi.fn();
        render(<AddCollaboratorModal onClose={onClose} onAdd={onAdd} />);

        fireEvent.click(screen.getByText('Select Alice'));
        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(onAdd).toHaveBeenCalledWith([{ id: 1, username: 'alice' }]);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it('shows error message when onAdd throws', async () => {
        const onAdd = vi.fn().mockRejectedValue(new Error('Already a member'));
        const onClose = vi.fn();
        render(<AddCollaboratorModal onClose={onClose} onAdd={onAdd} />);

        fireEvent.click(screen.getByText('Select Alice'));
        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(screen.getByText('Already a member')).toBeTruthy();
        });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('uses the filter default users branch and renders the custom empty state content', async () => {
        render(<AddCollaboratorModal onClose={vi.fn()} onAdd={vi.fn()} />);

        expect(screen.getByTestId('default-filtered-results').textContent).toBe('');
        await waitFor(() => {
            expect(screen.getByTestId('rendered-empty-state').textContent).toContain('No users found');
        });
    });
});
