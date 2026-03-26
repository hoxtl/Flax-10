import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsModal from '../../../components/Society/society_detail/SettingsModal';

const confirmMock = vi.fn();

vi.mock('../../../context/ConfirmContext', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('../../../components/Society/society_detail/SettingsModal.module.css', () => ({
    default: { backdrop: 'backdrop', modal: 'modal', header: 'header', title: 'title' }
}));
import styles from '../../../components/Society/society_detail/SettingsModal.module.css';

vi.mock('../../../components/Society/AddCollaboratorModal', () => ({
  default: ({ onClose, onAdd, existingUsernames }) => (
    <div>
      <div data-testid="existing-users">{existingUsernames.join(',')}</div>
      <button onClick={() => onAdd([{ username: 'existingUser' }, { username: 'newUser' }])}>submit-add</button>
      <button onClick={onClose}>close-add-modal</button>
    </div>
  ),
}));

vi.mock('../../../components/Society/CollaboratorList', () => ({
  default: ({ collaborators, onRoleChange, onRemove }) => (
    <div>
      <div data-testid="collab-count">{collaborators.length}</div>
      <button onClick={() => onRoleChange(99, 'owner')}>role-change</button>
      <button onClick={() => onRemove(77)}>remove-member</button>
    </div>
  ),
}));

vi.mock('../../../components/Society/society_detail/RatificationSection', () => ({
  RatificationSection: ({ status }) => <div>Ratification: {status}</div>,
}));

function baseProps(overrides = {}) {
  return {
    onClose: vi.fn(),
    onDelete: vi.fn(),
    onFetchMembers: vi.fn(),
    onUpdateRole: vi.fn(),
    onAddCollaborator: vi.fn(),
    onRemoveMember: vi.fn(),
    onRequestRatification: vi.fn(),
    ratificationStatus: 'draft',
    isRatified: false,
    members: [
      { user: 1, username: 'existingUser', role: 'member' },
      { user: 2, username: 'editorA', role: 'editor' },
    ],
    ...overrides,
  };
}

describe('SocietyDetail/SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirmMock.mockResolvedValue(true);
  });

  it('fetches members on mount and renders sections', () => {
    const props = baseProps();
    render(<SettingsModal {...props} />);

    expect(props.onFetchMembers).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByText('Ratification: draft')).toBeTruthy();
  });

  it('handles collaborator list interactions and add modal workflow', async () => {
    const props = baseProps();
    render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByText('role-change'));
    expect(props.onUpdateRole).toHaveBeenCalledWith(99, 'owner');

    fireEvent.click(screen.getByText('remove-member'));
    expect(props.onRemoveMember).toHaveBeenCalledWith(77);

    fireEvent.click(screen.getByText('+ Add Collaborators'));
    expect(await screen.findByText('submit-add')).toBeTruthy();

    expect(screen.getByTestId('existing-users').textContent).toBe('editorA');

    fireEvent.click(screen.getByText('submit-add'));

    await waitFor(() => {
      expect(props.onUpdateRole).toHaveBeenCalledWith(1, 'editor');
      expect(props.onAddCollaborator).toHaveBeenCalledWith('newUser', 'editor');
    });

    expect(props.onFetchMembers).toHaveBeenCalledTimes(2);
  });

  it('supports close actions and confirms deletion', async () => {
    const props = baseProps();
    const { container } = render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);

    // Modal backdrop is portal-rendered into document.body.
    const backdrop = document.body.querySelector('div[class*="_backdrop"]');
    expect(backdrop).toBeTruthy();
    fireEvent.mouseDown(backdrop);
    expect(props.onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('Delete Society'));
    await waitFor(() => {
      expect(confirmMock).toHaveBeenCalled();
      expect(props.onDelete).toHaveBeenCalled();
      expect(props.onClose).toHaveBeenCalledTimes(3);
    });
  });

  it('does not delete when confirm is declined', async () => {
    confirmMock.mockResolvedValue(false);
    const props = baseProps();
    render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByText('Delete Society'));

    await waitFor(() => expect(confirmMock).toHaveBeenCalled());
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('closes add collaborator modal without submitting', async () => {
    const props = baseProps();
    render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByText('+ Add Collaborators'));
    expect(await screen.findByText('submit-add')).toBeTruthy();

    fireEvent.click(screen.getByText('close-add-modal'));
    await waitFor(() => expect(screen.queryByText('submit-add')).toBeNull());
  });

  it('handles members being null', () => {
    const props = baseProps({ members: null });
    render(<SettingsModal {...props} />);
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByTestId('collab-count').textContent).toBe('0');
  });

  it('handles add only new users when none exist in members', async () => {
    const props = baseProps({ members: [] });
    render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByText('+ Add Collaborators'));
    fireEvent.click(await screen.findByText('submit-add'));

    await waitFor(() => {
      expect(props.onAddCollaborator).toHaveBeenCalledWith('existingUser', 'editor');
      expect(props.onAddCollaborator).toHaveBeenCalledWith('newUser', 'editor');
    });
  });

  it('handles add workflow when members is omitted', async () => {
    const props = baseProps({ members: undefined });
    render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByText('+ Add Collaborators'));
    fireEvent.click(await screen.findByText('submit-add'));

    await waitFor(() => {
      expect(props.onAddCollaborator).toHaveBeenCalledWith('existingUser', 'editor');
      expect(props.onAddCollaborator).toHaveBeenCalledWith('newUser', 'editor');
    });
  });

  it('stops propagation when modal content is clicked', () => {
    const props = baseProps();
    render(<SettingsModal {...props} />);
    const modalContent = screen.getByRole('heading', { name: 'Settings' }).closest('.' + styles.modal);
    const e = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const spy = vi.spyOn(e, 'stopPropagation');
    fireEvent(modalContent, e);
    expect(spy).toHaveBeenCalled();
  });
});
