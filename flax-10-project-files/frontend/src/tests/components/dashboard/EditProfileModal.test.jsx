import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EditProfileModal from '../../../components/dashboard/EditProfileModal';

const updateUserProfileMock = vi.fn();

vi.mock('../../../api/userApi', () => ({
  updateUserProfile: (...args) => updateUserProfileMock(...args),
}));

vi.mock('../../../components/Auth/utils/userUtils', () => ({
  getInitials: () => 'AB',
}));

const user = {
  username: 'alice',
  name: 'Alice Bob',
  bio: 'old bio',
  profile_photo_url: 'https://example.com/photo.jpg',
};

describe('EditProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ available: true }) }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    localStorage.setItem('token', 'token-123');
    updateUserProfileMock.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when closed', () => {
    const { container } = render(<EditProfileModal user={user} isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('validates username length before submit', async () => {
    render(<EditProfileModal user={user} isOpen onClose={vi.fn()} onSave={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByText('Save Changes'));

    expect(await screen.findByText('Username must be at least 3 characters long')).toBeTruthy();
    expect(updateUserProfileMock).not.toHaveBeenCalled();
  });

  it('shows username taken error when availability check fails', async () => {
    global.fetch.mockResolvedValueOnce({ json: async () => ({ available: false }) });
    render(<EditProfileModal user={user} isOpen onClose={vi.fn()} onSave={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'taken_name' } });
    fireEvent.click(screen.getByText('Save Changes'));

    expect(await screen.findByText('Username is already taken')).toBeTruthy();
    expect(updateUserProfileMock).not.toHaveBeenCalled();
  });

  it('submits form successfully and shows saved tick feedback', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<EditProfileModal user={user} isOpen onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'new_name' } });
    fireEvent.change(screen.getByPlaceholderText('Add a personal reminder note...'), { target: { value: 'new bio' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(updateUserProfileMock).toHaveBeenCalledTimes(1);
      const formData = updateUserProfileMock.mock.calls[0][0];
      expect(formData.get('username')).toBe('new_name');
      expect(formData.get('bio')).toBe('new bio');
    });

    expect(await screen.findByRole('button', { name: '✓ Saved!' })).toBeTruthy();
    expect(screen.queryByText('Profile saved successfully!')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('supports photo upload/remove and shows server error', async () => {
    updateUserProfileMock.mockRejectedValueOnce({ response: { data: { error: 'Server exploded' } } });
    render(<EditProfileModal user={user} isOpen onClose={vi.fn()} onSave={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['img'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByAltText('Preview')).toBeTruthy();

    fireEvent.click(screen.getByText('Remove Photo'));
    fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'new_name_2' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(updateUserProfileMock).toHaveBeenCalled();
      const formData = updateUserProfileMock.mock.calls[0][0];
      expect(formData.get('remove_photo')).toBe('true');
    });

    expect(await screen.findByText('Server exploded')).toBeTruthy();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<EditProfileModal user={user} isOpen onClose={onClose} onSave={vi.fn()} />);
    const backdrop = document.querySelector('[class*="backdrop"]');
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<EditProfileModal user={user} isOpen onClose={onClose} onSave={vi.fn()} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('skips username availability check when username unchanged', async () => {
    render(<EditProfileModal user={user} isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Add a personal reminder note...'), { target: { value: 'updated bio' } });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(updateUserProfileMock).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows generic error when update fails without response data', async () => {
    updateUserProfileMock.mockRejectedValueOnce(new Error('network'));
    render(<EditProfileModal user={user} isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(await screen.findByText('Failed to update profile')).toBeTruthy();
  });

  it('uses username initials when user has no name', () => {
    const userNoName = { username: 'bob', bio: '', profile_photo_url: null };
    render(<EditProfileModal user={userNoName} isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    expect(document.querySelector('[class*="photoPlaceholder"]')?.textContent).toBe('BO');
  });

  it('does not show Remove Photo when user has no photo and no preview', () => {
    const userNoPhoto = { username: 'x', name: 'X', bio: '', profile_photo_url: null };
    render(<EditProfileModal user={userNoPhoto} isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByText('Remove Photo')).toBeNull();
  });

  it('submits with new photo file when photo added without removing', async () => {
    const file = new File(['x'], 'p.png', { type: 'image/png' });
    render(<EditProfileModal user={user} isOpen onClose={vi.fn()} onSave={vi.fn()} />);
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'alice' } });
    fireEvent.click(screen.getByText('Save Changes'));
    await waitFor(() => expect(updateUserProfileMock).toHaveBeenCalled());
    const formData = updateUserProfileMock.mock.calls[0][0];
    expect(formData.get('profile_photo')).toEqual(file);
    expect(formData.get('remove_photo')).toBeNull();
  });
});
