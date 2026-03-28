import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const useToastMock = vi.fn();
const imageFileMocks = vi.hoisted(() => ({
    readImageFile: vi.fn(),
    resetFileInput: vi.fn(),
}));

vi.mock('../../../../components/society/styles/CreateSocietyModal.module.css', () => ({ default: {} }));
vi.mock('../../../../components/society/components/AddCollaboratorModal', () => ({
    default: ({ onClose, onAdd }) => (
        <div data-testid="collab-modal">
            <button onClick={onClose}>CloseCollab</button>
            <button onClick={() => onAdd([{ id: 'u1', username: 'alice' }])}>AddCollab</button>
            <button onClick={() => onAdd([{ id: 'u2', username: 'bob' }])}>AddSecondCollab</button>
        </div>
    ),
}));
vi.mock('../../../../components/society/components/CollaboratorList', () => ({
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
vi.mock('../../../../components/society/society_detail/RatificationSection', () => ({
    RatificationToggle: ({ requested, onToggle }) => (
        <button data-testid="ratification-toggle" onClick={() => onToggle(!requested)}>
            {requested ? 'Ratification On' : 'Ratification Off'}
        </button>
    ),
}));
vi.mock('../../../../components/common/tags_selector/TagsSelector', () => ({
    TagsSelector: ({ tags, selectedTags, onSelectionChange, emptyHint }) => (
        <div>
            <span>{emptyHint}</span>
            <button onClick={() => onSelectionChange([{ id: 'Tech', label: 'Tech' }])}>SelectCategory</button>
        </div>
    ),
}));
vi.mock('../../../../components/common/standard_modal/StandardModal', () => ({
    default: ({ title, subtitle, onClose, children }) => (
        <div data-testid="standard-modal">
            <span>{title}</span>
            <span>{subtitle}</span>
            <button onClick={onClose}>CloseModal</button>
            {children}
        </div>
    ),
}));
vi.mock('../../../../context/ToastContext', () => ({
    useToast: () => useToastMock(),
}));
vi.mock('../../../../utils/imageFile', () => imageFileMocks);

import CreateSocietyModal from '../../../../components/society/components/CreateSocietyModal';

function getCoverImageInput() {
    return document.querySelector('input[type="file"][accept="image/*"]');
}

describe('CreateSocietyModal', () => {
    let onClose;
    let onCreate;

    beforeEach(() => {
        onClose = vi.fn();
        onCreate = vi.fn();
        useToastMock.mockReset();
        useToastMock.mockReturnValue(undefined);
        imageFileMocks.readImageFile.mockReset();
        imageFileMocks.resetFileInput.mockReset();
        vi.clearAllMocks();
    });

    it('renders the modal with title and subtitle', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getAllByText('Create Society').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the Society Name field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByPlaceholderText('e.g. Photography Club')).toBeInTheDocument();
        expect(screen.getByText(/Society Name/)).toBeInTheDocument();
    });

    it('renders the Bio field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByPlaceholderText('What is your society about?')).toBeInTheDocument();
    });

    it('renders Admin Emails field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByText(/Admin Emails/)).toBeInTheDocument();
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

    it('calls onCreate with form data when Create Society is clicked', async () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Chess Club' },
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        });
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

    it('opens the hidden file picker when Add Cover Image is clicked', () => {
        const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.click(screen.getByText('+ Add Cover Image'));
        expect(clickSpy).toHaveBeenCalledTimes(1);
        clickSpy.mockRestore();
    });

    it('passes the selected file to the image reader helper', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        const file = new File(['cover'], 'cover.png', { type: 'image/png' });
        fireEvent.change(getCoverImageInput(), { target: { files: [file] } });
        expect(imageFileMocks.readImageFile).toHaveBeenCalledWith(file, expect.any(Function), expect.any(Function));
    });

    it('updates images when a cover image file is selected', () => {
        imageFileMocks.readImageFile.mockImplementationOnce((file, onLoad, onReset) => {
            onLoad('http://example.com/img.jpg');
            onReset();
        });
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(getCoverImageInput(), {
            target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
        });
        expect(screen.getByText('(1/1)')).toBeInTheDocument();
        expect(imageFileMocks.resetFileInput).toHaveBeenCalledTimes(1);
    });

    it('shows Replace Cover Image label after photo added', () => {
        imageFileMocks.readImageFile.mockImplementationOnce((file, onLoad, onReset) => {
            onLoad('http://example.com/img.jpg');
            onReset();
        });
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(getCoverImageInput(), {
            target: { files: [new File(['cover'], 'cover.png', { type: 'image/png' })] },
        });
        expect(screen.getByText('Replace Cover Image')).toBeInTheDocument();
    });

    it('toggles ratification via the RatificationToggle', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByTestId('ratification-toggle')).toHaveTextContent('Ratification Off');
        fireEvent.click(screen.getByTestId('ratification-toggle'));
        expect(screen.getByTestId('ratification-toggle')).toHaveTextContent('Ratification On');
    });

    it('shows empty collaborators message initially', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        expect(screen.getByText('+ Add Collaborators')).toBeInTheDocument();
        expect(screen.queryByTestId('collab-list')).not.toBeInTheDocument();
    });

    it('can update bio field', () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        const bio = screen.getByPlaceholderText('What is your society about?');
        fireEvent.change(bio, { target: { value: 'A fun photography club' } });
        expect(bio.value).toBe('A fun photography club');
    });

    it('includes bio in onCreate form data', async () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Society X' },
        });
        fireEvent.change(screen.getByPlaceholderText('What is your society about?'), {
            target: { value: 'About us' },
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        });
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Society X', bio: 'About us' })
        );
    });

    it('includes categories in onCreate form data', async () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Tech Society' },
        });
        fireEvent.click(screen.getByText('SelectCategory'));
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        });
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

    it('updates collaborator roles before submit', async () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);

        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Role Test Society' },
        });
        fireEvent.click(screen.getByText('+ Add Collaborators'));
        fireEvent.click(screen.getByText('AddCollab'));
        fireEvent.click(screen.getByText('ChangeRole'));
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        });

        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                collaborators: [expect.objectContaining({ id: 'u1', role: 'viewer' })],
            })
        );
    });

    it('preserves untouched collaborators when roles change and when one collaborator is removed', async () => {
        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);

        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Team Society' },
        });
        fireEvent.click(screen.getByText('+ Add Collaborators'));
        fireEvent.click(screen.getByText('AddCollab'));
        fireEvent.click(screen.getByText('AddSecondCollab'));
        fireEvent.click(screen.getAllByText('ChangeRole')[0]);
        fireEvent.click(screen.getAllByText('Remove')[0]);
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        });

        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                collaborators: [expect.objectContaining({ id: 'u2', role: 'editor' })],
            })
        );
    });

    it('shows Cover Image (0/1) label initially', () => {
        const { container } = render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        const addCoverImageBtn = screen.getByText('+ Add Cover Image');
        expect(addCoverImageBtn).toBeInTheDocument();
        const labels = container.querySelectorAll('label');
        const coverImageLabel = Array.from(labels).find(l => l.textContent.includes('Cover Image'));
        expect(coverImageLabel).toBeTruthy();
        expect(coverImageLabel.textContent).toContain('(0/1)');
    });

    it('shows the submit error and toast when creation fails with an explicit message', async () => {
        const showToast = vi.fn();
        useToastMock.mockReturnValue(showToast);
        onCreate.mockRejectedValue(new Error('Creation failed'));

        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Drama Society' },
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        });

        expect(screen.getByText('Creation failed')).toBeInTheDocument();
        expect(showToast).toHaveBeenCalledWith('Creation failed', { variant: 'error' });
    });

    it('uses the fallback submit error when creation fails without a message', async () => {
        onCreate.mockRejectedValue({});

        render(<CreateSocietyModal onClose={onClose} onCreate={onCreate} />);
        fireEvent.change(screen.getByPlaceholderText('e.g. Photography Club'), {
            target: { value: 'Debate Society' },
        });

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Create Society' }));
        });

        expect(screen.getByText("Couldn't create the society just yet.")).toBeInTheDocument();
    });
});
