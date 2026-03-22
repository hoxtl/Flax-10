import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../components/Society/CreateSocietyModal.module.css', () => ({ default: {} }));
vi.mock('../../../components/Society/AddCollaboratorModal', () => ({
    default: ({ onClose, onAdd }) => (
        <div data-testid="collab-modal">
            <button onClick={onClose}>CloseCollab</button>
            <button onClick={() => onAdd([{ id: 'u1', username: 'alice' }])}>AddCollab</button>
        </div>
    ),
}));
vi.mock('../../../components/Society/CollaboratorList', () => ({
    default: ({ collaborators, onRoleChange, onRemove, emptyMessage }) => (
        <div data-testid="collab-list">
            <span>{emptyMessage}</span>
            {collaborators.map(c => (
                <div key={c.id} data-testid={`collab-${c.id}`}>
                    <span>{c.username}</span>
                    <button onClick={() => onRoleChange(c.id, 'viewer')}>ChangeRole</button>
                    <button onClick={() => onRemove(c.id)}>Remove</button>
                </div>
            ))}
        </div>
    ),
}));
vi.mock('../../../components/Society/SocietyDetail/RatificationSection', () => ({
    RatificationToggle: ({ requested, onToggle }) => (
        <button data-testid="ratification-toggle" onClick={() => onToggle(!requested)}>
            {requested ? 'Ratification On' : 'Ratification Off'}
        </button>
    ),
}));
vi.mock('../../../components/Society/SocietyDetail/imageHandlers/CoverImageModal', () => ({
    default: ({ onClose, onUpdate }) => (
        <div data-testid="photo-modal">
            <button onClick={onClose}>ClosePhoto</button>
            <button onClick={() => onUpdate(['http://example.com/img.jpg'])}>AddPhoto</button>
        </div>
    ),
}));
vi.mock('../../../components/Society/CategorySelector', () => ({
    default: ({ value, onChange, label }) => (
        <div>
            <label>{label}</label>
            <button onClick={() => onChange(['Tech'])}>SelectCategory</button>
        </div>
    ),
}));
vi.mock('../../../components/Common/StandardModal/StandardModal', () => ({
    default: ({ title, subtitle, onClose, children }) => (
        <div data-testid="standard-modal">
            <span>{title}</span>
            <span>{subtitle}</span>
            <button onClick={onClose}>CloseModal</button>
            {children}
        </div>
    ),
}));

import CreateSocietyModal from '../../../components/Society/CreateSocietyModal';

describe('CreateSocietyModal', () => {
    let onClose;
    let onCreate;

    beforeEach(() => {
        onClose = vi.fn();
        onCreate = vi.fn();
        vi.clearAllMocks();
    });

    it('renders the modal with title and subtitle', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getAllByText('Create Society').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Start your own society')).toBeInTheDocument();
    });

    it('renders the Society Name field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByPlaceholderText('e.g. Photography Club')).toBeInTheDocument();
        expect(screen.getByText('Society Name *')).toBeInTheDocument();
    });

    it('renders the Bio field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByPlaceholderText('What is your society about?')).toBeInTheDocument();
    });

    it('renders Admin Emails field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByText('Admin Emails (optional)')).toBeInTheDocument();
    });

    it('renders the Create Society button disabled when name is empty', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        const btn = screen.getByRole('button', { name: 'Create Society' });
        expect(btn).toBeDisabled();
    });

    it('enables Create Society button when name is filled', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Photography Club' },
        });
        const btn = screen.getByRole('button', { name: 'Create Society' });
        expect(btn).not.toBeDisabled();
    });

    it('calls onClose when Cancel button is clicked', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose via StandardModal close button', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('CloseModal'));
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onCreate with form data when Create Society is clicked', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Chess Club' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Chess Club' })
        );
    });

    it('shows email error when an invalid email is entered', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        const emailInput = screen.getByPlaceholderText('e.g. contact@society.com, admin@society.com');
        fireEvent.change(emailInput, { target: { value: 'notanemail' } });
        expect(screen.getByText('Please check all emails are valid')).toBeInTheDocument();
    });

    it('disables create button when email is invalid', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Test Society' },
        });
        fireEvent.change(screen.getByPlaceholderText('e.g. contact@society.com, admin@society.com'), {
            target: { value: 'bademail' },
        });
        const btn = screen.getByRole('button', { name: 'Create Society' });
        expect(btn).toBeDisabled();
    });

    it('does not show email error when email field is empty', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.queryByText('Please check all emails are valid')).not.toBeInTheDocument();
    });

    it('accepts valid comma-separated emails', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Test Society' },
        });
        fireEvent.change(screen.getByPlaceholderText('e.g. contact@society.com, admin@society.com'), {
            target: { value: 'a@b.com, c@d.com' },
        });
        expect(screen.queryByText('Please check all emails are valid')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create Society' })).not.toBeDisabled();
    });

    it('opens collaborator modal when Add Collaborators is clicked', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Collaborators'));
        expect(screen.getByTestId('collab-modal')).toBeInTheDocument();
    });

    it('closes collaborator modal when CloseCollab is clicked', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Collaborators'));
        fireEvent.click(screen.getByText('CloseCollab'));
        expect(screen.queryByTestId('collab-modal')).not.toBeInTheDocument();
    });

    it('adds collaborators from the collaborator modal', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Collaborators'));
        fireEvent.click(screen.getByText('AddCollab'));
        expect(screen.getByText('alice')).toBeInTheDocument();
    });

    it('opens photo modal when Add Photos is clicked', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Photos'));
        expect(screen.getByTestId('photo-modal')).toBeInTheDocument();
    });

    it('closes photo modal when ClosePhoto is clicked', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Photos'));
        fireEvent.click(screen.getByText('ClosePhoto'));
        expect(screen.queryByTestId('photo-modal')).not.toBeInTheDocument();
    });

    it('updates images when photo is added via photo modal', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Photos'));
        fireEvent.click(screen.getByText('AddPhoto'));
        // After adding a photo, the label should show Photos (1/5)
        expect(screen.getByText('Photos (1/5)')).toBeInTheDocument();
    });

    it('shows Manage Photos label after photo added', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Photos'));
        fireEvent.click(screen.getByText('AddPhoto'));
        expect(screen.getByText('Manage Photos')).toBeInTheDocument();
    });

    it('toggles ratification via the RatificationToggle', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByTestId('ratification-toggle')).toHaveTextContent('Ratification Off');
        fireEvent.click(screen.getByTestId('ratification-toggle'));
        expect(screen.getByTestId('ratification-toggle')).toHaveTextContent('Ratification On');
    });

    it('shows empty collaborators message initially', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByText('No collaborators added yet.')).toBeInTheDocument();
    });

    it('can update bio field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        const bio = screen.getByPlaceholderText('What is your society about?');
        fireEvent.change(bio, { target: { value: 'A fun photography club' } });
        expect(bio.value).toBe('A fun photography club');
    });

    it('includes bio in onCreate form data', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Society X' },
        });
        fireEvent.change(screen.getByPlaceholderText('What is your society about?'), {
            target: { value: 'About us' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Society X', bio: 'About us' })
        );
    });

    it('includes categories in onCreate form data', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Tech Society' },
        });
        fireEvent.click(screen.getByText('SelectCategory'));
        fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ categories: ['Tech'] })
        );
    });

    it('removes a collaborator via Remove button', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        // Add a collaborator first
        fireEvent.click(screen.getByText('+ Add Collaborators'));
        fireEvent.click(screen.getByText('AddCollab'));
        // Now remove it
        fireEvent.click(screen.getByText('Remove'));
        expect(screen.queryByText('alice')).not.toBeInTheDocument();
    });

    it('shows Photos (0/5) label initially', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByText('Photos (0/5)')).toBeInTheDocument();
    });
});
