import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/society/CollaboratorList.test.jsx
import CollaboratorList from '../../../components/society/components/CollaboratorList';
=======
import CollaboratorList from '../../../components/society/CollaboratorList';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Society/CollaboratorList.test.jsx

vi.mock('../../../components/common/animated_dropdown', () => ({
    default: ({ value, onChange, options, placeholder }) => (
        <select aria-label={placeholder} value={value} onChange={e => onChange(e.target.value)}>
            {(options || []).map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ),
}));

const collaborators = [
    { id: 1, user: 10, username: 'alice', role: 'editor' },
    { id: 2, user: 11, username: 'bob', role: 'admin' },
];

describe('CollaboratorList', () => {
    it('renders empty message when no collaborators', () => {
        render(<CollaboratorList collaborators={[]} />);
        expect(screen.getByText('No collaborators yet.')).toBeTruthy();
    });

    it('renders custom empty message', () => {
        render(<CollaboratorList collaborators={[]} emptyMessage="No members yet." />);
        expect(screen.getByText('No members yet.')).toBeTruthy();
    });

    it('renders empty message when null collaborators', () => {
        render(<CollaboratorList collaborators={null} />);
        expect(screen.getByText('No collaborators yet.')).toBeTruthy();
    });

    it('renders collaborator usernames', () => {
        render(<CollaboratorList collaborators={collaborators} onRoleChange={vi.fn()} onRemove={vi.fn()} />);
        expect(screen.getByText('alice')).toBeTruthy();
        expect(screen.getByText('bob')).toBeTruthy();
    });

    it('renders role select for each collaborator', () => {
        render(<CollaboratorList collaborators={collaborators} onRoleChange={vi.fn()} onRemove={vi.fn()} />);
        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(2);
    });

    it('calls onRoleChange when role is changed', () => {
        const onRoleChange = vi.fn();
        render(<CollaboratorList collaborators={collaborators} onRoleChange={onRoleChange} onRemove={vi.fn()} />);
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'admin' } });
        expect(onRoleChange).toHaveBeenCalledWith(10, 'admin'); // user id = 10
    });

    it('calls onRemove when remove button is clicked', () => {
        const onRemove = vi.fn();
        render(<CollaboratorList collaborators={collaborators} onRoleChange={vi.fn()} onRemove={onRemove} />);
        const removeButtons = screen.getAllByTitle('Remove');
        fireEvent.click(removeButtons[0]);
        expect(onRemove).toHaveBeenCalledWith(10);
    });

    it('renders remove button for each collaborator', () => {
        render(<CollaboratorList collaborators={collaborators} onRoleChange={vi.fn()} onRemove={vi.fn()} />);
        expect(screen.getAllByTitle('Remove')).toHaveLength(2);
    });

    it('handles missing onRoleChange gracefully', () => {
        render(<CollaboratorList collaborators={collaborators} onRemove={vi.fn()} />);
        const selects = screen.getAllByRole('combobox');
        expect(() => fireEvent.change(selects[0], { target: { value: 'admin' } })).not.toThrow();
    });

    it('handles missing onRemove gracefully', () => {
        render(<CollaboratorList collaborators={collaborators} onRoleChange={vi.fn()} />);
        const removeButtons = screen.getAllByTitle('Remove');
        expect(() => fireEvent.click(removeButtons[0])).not.toThrow();
    });
});
