import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EditProfileModal from '../../../components/Dashboard/EditProfileModal';

const updateUserProfileMock = vi.fn();

vi.mock('../../../api/userService', () => ({
  updateUserProfile: (...args) => updateUserProfileMock(...args),
}));

vi.mock('../../../components/Authentication/utils/userUtils', () => ({
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

  it('submits form successfully and closes after delay', async () => {
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

    expect(await screen.findByText('Profile saved successfully!')).toBeTruthy();
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2500 });
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
});
