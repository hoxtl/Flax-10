import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockRefreshProfile = vi.fn();
let mockProfileData = {
    year: 'Year 2',
    major: 'Computer Science',
    profile_photo_url: null,
};

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        profile: mockProfileData,
        refreshProfile: mockRefreshProfile,
    }),
}));

<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/dashboard/ProfileDropdown.test.jsx
import ProfileDropdown from '../../../components/dashboard/components/ProfileDropdown';
=======
import ProfileDropdown from '../../../components/dashboard/ProfileDropdown';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Dashboard/ProfileDropdown.test.jsx

const defaultUser = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith' };

function renderDropdown(props = {}) {
    return render(
        <ProfileDropdown
            user={defaultUser}
            onSettingsClick={vi.fn()}
            onLogoutClick={vi.fn()}
            onProfileClick={vi.fn()}
            {...props}
        />
    );
}

describe('ProfileDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfileData = {
            year: 'Year 2',
            major: 'Computer Science',
            profile_photo_url: null,
        };
    });

    it('renders avatar button', () => {
        renderDropdown();
        expect(screen.getByLabelText('User menu')).toBeTruthy();
    });

    it('dropdown is closed by default', () => {
        renderDropdown();
        expect(screen.queryByText('Profile')).toBeNull();
    });

    it('opens dropdown when avatar button is clicked', () => {
        renderDropdown();
        fireEvent.click(screen.getByLabelText('User menu'));
        expect(screen.getByText('Profile')).toBeTruthy();
        expect(screen.getByText('Settings')).toBeTruthy();
        expect(screen.getByText('Log out')).toBeTruthy();
    });

    it('calls onSettingsClick when Settings is clicked', () => {
        const onSettingsClick = vi.fn();
        renderDropdown({ onSettingsClick });
        fireEvent.click(screen.getByLabelText('User menu'));
        fireEvent.click(screen.getByText('Settings'));
        expect(onSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('calls onLogoutClick when Log out is clicked', () => {
        const onLogoutClick = vi.fn();
        renderDropdown({ onLogoutClick });
        fireEvent.click(screen.getByLabelText('User menu'));
        fireEvent.click(screen.getByText('Log out'));
        expect(onLogoutClick).toHaveBeenCalledTimes(1);
    });

    it('calls onProfileClick when Profile is clicked', () => {
        const onProfileClick = vi.fn();
        renderDropdown({ onProfileClick });
        fireEvent.click(screen.getByLabelText('User menu'));
        fireEvent.click(screen.getByText('Profile'));
        expect(onProfileClick).toHaveBeenCalledTimes(1);
    });

    it('closes dropdown when clicking outside', () => {
        renderDropdown();
        fireEvent.click(screen.getByLabelText('User menu'));
        expect(screen.getByText('Profile')).toBeTruthy();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByText('Profile')).toBeNull();
    });

    it('loads profile data and displays user info', async () => {
        renderDropdown();
        fireEvent.click(screen.getByLabelText('User menu'));
        await waitFor(() => expect(screen.getByText('Computer Science')).toBeTruthy());
    });

    it('shows displayName fallback when user has no name or first/last', () => {
        renderDropdown({ user: {} });
        fireEvent.click(screen.getByLabelText('User menu'));
        expect(screen.getByText('User')).toBeTruthy();
    });

    it('shows profile photo in dropdown when profile_photo_url exists', async () => {
        mockProfileData = { ...mockProfileData, profile_photo_url: 'https://example.com/me.jpg', year: 'Year 1', major: 'Math' };
        renderDropdown();
        fireEvent.click(screen.getByLabelText('User menu'));
        await waitFor(() => expect(screen.getAllByAltText('Profile').length).toBeGreaterThan(0));
    });

    it('handles missing profile photo gracefully', async () => {
        mockProfileData = { ...mockProfileData, profile_photo_url: null };
        renderDropdown();
        fireEvent.click(screen.getByLabelText('User menu'));
        await waitFor(() => expect(screen.getByText('Profile')).toBeTruthy());
    });

    it('does not register click outside when dropdown is closed', () => {
        render(<ProfileDropdown user={defaultUser} onSettingsClick={vi.fn()} onLogoutClick={vi.fn()} onProfileClick={vi.fn()} />);
        fireEvent.mouseDown(document.body);
        expect(screen.queryByText('Settings')).toBeNull();
    });
});
