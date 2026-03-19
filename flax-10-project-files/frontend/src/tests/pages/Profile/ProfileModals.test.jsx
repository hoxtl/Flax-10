import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileModals from '../../../pages/Profile/ProfileModals';

vi.mock('../../../components/Dashboard/EditProfileModal', () => ({
    default: ({ isOpen, onClose }) =>
        isOpen ? <div data-testid="edit-profile-modal"><button onClick={onClose}>Close Edit</button></div> : null,
}));

vi.mock('../../../components/Social/UserListModal', () => ({
    default: ({ title, users, onClose, onUserClick }) => (
        <div data-testid="user-list-modal">
            <span>{title}</span>
            <button type="button" onClick={onClose}>Close List</button>
            {(users || []).map((u, i) => (
                <div key={i} data-testid="user-item" role="button" tabIndex={0} onClick={() => onUserClick?.(u)} onKeyDown={e => e.key === 'Enter' && onUserClick?.(u)}>
                    {u.username}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../api/socialService', () => ({
    getSharingWith: vi.fn().mockResolvedValue([]),
    getSharedWithMe: vi.fn().mockResolvedValue([]),
}));

function makeState(overrides = {}) {
    return {
        showEditProfile: false,
        setShowEditProfile: vi.fn(),
        handleSaveProfile: vi.fn(),
        profileData: { id: 1 },
        showModules: false,
        setShowModules: vi.fn(),
        showTasks: false,
        setShowTasks: vi.fn(),
        showSharedWith: false,
        setShowSharedWith: vi.fn(),
        showSharedBy: false,
        setShowSharedBy: vi.fn(),
        showEvents: false,
        setShowEvents: vi.fn(),
        eventRange: 'week',
        setEventRange: vi.fn(),
        reload: vi.fn(),
        ...overrides,
    };
}

const defaultUser = { id: 1, username: 'alice' };
const defaultModules = ['CS101', 'MA202'];
const defaultEvents = [{ title: 'Meeting', start_time: '2024-03-08T10:00:00Z', location: 'Room A' }];

const defaultVisibility = {
    canEditProfile: true,
    canViewModules: true,
    canViewTasks: true,
    canViewSharedWith: true,
    canViewEvents: true,
};

function renderModals({ state: stateOverrides = {}, modules, filteredEvents, visibility: visibilityOverrides, onNavChange } = {}) {
    const visibility = { ...defaultVisibility, ...visibilityOverrides };
    return render(
        <ProfileModals
            user={defaultUser}
            state={makeState(stateOverrides)}
            modules={modules ?? defaultModules}
            filteredEvents={filteredEvents ?? defaultEvents}
            visibility={visibility}
            onNavChange={onNavChange ?? vi.fn()}
        />
    );
}

describe('ProfileModals', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders nothing when all modals closed', () => {
        const { container } = renderModals();
        // EditProfileModal returns null when closed; no visible modals
        expect(screen.queryByTestId('edit-profile-modal')).toBeNull();
        expect(container.textContent).toBe('');
    });

    it('renders edit profile modal when showEditProfile is true', () => {
        renderModals({ state: { showEditProfile: true } });
        expect(screen.getByTestId('edit-profile-modal')).toBeTruthy();
    });

    it('renders modules modal when showModules is true', () => {
        renderModals({ state: { showModules: true } });
        expect(screen.getByText('Modules')).toBeTruthy();
        expect(screen.getByText('CS101')).toBeTruthy();
        expect(screen.getByText('MA202')).toBeTruthy();
    });

    it('renders empty modules message when no modules', () => {
        renderModals({ state: { showModules: true }, modules: [] });
        expect(screen.getByText('No modules found')).toBeTruthy();
    });

    it('renders tasks modal when showTasks is true', async () => {
        renderModals({ state: { showTasks: true } });
        expect(screen.getByText('Tasks')).toBeTruthy();
        await waitFor(() => expect(screen.getByText(/No active tasks right now/i)).toBeTruthy());
    });

    it('renders events modal when showEvents is true', () => {
        renderModals({ state: { showEvents: true } });
        expect(screen.getByText(/Events/)).toBeTruthy();
        expect(screen.getByText('Meeting')).toBeTruthy();
    });

    it('renders empty events message when no events', () => {
        renderModals({ state: { showEvents: true }, filteredEvents: [] });
        expect(screen.getByText('No events found for this period')).toBeTruthy();
    });

    it('calls setEventRange when range button is clicked', () => {
        const setEventRange = vi.fn();
        renderModals({ state: { showEvents: true, setEventRange } });
        // Click on a specific range label button (not the ✕ close button)
        fireEvent.click(screen.getByText('Today'));
        expect(setEventRange).toHaveBeenCalledWith('today');
    });

    it('does not render events modal when canViewEvents is false', () => {
        renderModals({ state: { showEvents: true }, visibility: { canViewEvents: false } });
        expect(screen.queryByText('Meeting')).toBeNull();
    });

    it('renders sharing modal when showSharedWith is true', async () => {
        const { getSharingWith } = await import('../../../api/socialService');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);
        renderModals({ state: { showSharedWith: true } });
        await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
        expect(screen.getByText('Sharing With')).toBeTruthy();
    });

    it('closes events modal when close button is clicked', () => {
        const setShowEvents = vi.fn();
        renderModals({ state: { showEvents: true, setShowEvents } });
        const closeBtn = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeBtn);
        expect(setShowEvents).toHaveBeenCalledWith(false);
    });

    it('modules modal click navigates and closes', () => {
        const onNavChange = vi.fn();
        const setShowModules = vi.fn();
        renderModals({ state: { showModules: true, setShowModules }, onNavChange });
        fireEvent.click(screen.getByText('CS101'));
        expect(onNavChange).toHaveBeenCalledWith('modules_CS101');
        expect(setShowModules).toHaveBeenCalledWith(false);
    });

    it('renders Shared By modal when showSharedBy is true', async () => {
        const { getSharedWithMe } = await import('../../../api/socialService');
        getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol' }]);
        renderModals({ state: { showSharedBy: true } });
        await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
        expect(screen.getByText('Shared By')).toBeTruthy();
    });

    it('SocialDataModal handles fetch error', async () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { getSharingWith } = await import('../../../api/socialService');
        getSharingWith.mockRejectedValueOnce(new Error('fetch failed'));
        renderModals({ state: { showSharedWith: true } });
        await waitFor(() => expect(getSharingWith).toHaveBeenCalled());
        expect(errSpy).toHaveBeenCalledWith('Failed to fetch users', expect.any(Error));
        errSpy.mockRestore();
    });

    it('events modal formats event without location', () => {
        const eventsNoLocation = [{ title: 'Remote Call', start_time: '2024-03-08T14:00:00Z' }];
        renderModals({ state: { showEvents: true }, filteredEvents: eventsNoLocation });
        expect(screen.getByText('Remote Call')).toBeTruthy();
        expect(screen.getByText(/8 Mar 2024 at/)).toBeTruthy();
        expect(screen.queryByText(/•/)).toBeNull();
    });

    it('closes Shared With modal and calls onNavChange when user clicked', async () => {
        const onNavChange = vi.fn();
        const setShowSharedWith = vi.fn();
        const { getSharingWith } = await import('../../../api/socialService');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);
        renderModals({ state: { showSharedWith: true, setShowSharedWith }, onNavChange });
        await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
        fireEvent.click(screen.getByText('bob'));
        expect(setShowSharedWith).toHaveBeenCalledWith(false);
        expect(onNavChange).toHaveBeenCalledWith('profile_2');
    });

    it('closes Shared With modal when Close List clicked', async () => {
        const setShowSharedWith = vi.fn();
        const { getSharingWith } = await import('../../../api/socialService');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);
        renderModals({ state: { showSharedWith: true, setShowSharedWith } });
        await waitFor(() => expect(screen.getByText('Close List')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Close List'));
        expect(setShowSharedWith).toHaveBeenCalledWith(false);
    });

    it('closes Shared By modal when Close List clicked', async () => {
        const setShowSharedBy = vi.fn();
        const { getSharedWithMe } = await import('../../../api/socialService');
        getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol' }]);
        renderModals({ state: { showSharedBy: true, setShowSharedBy } });
        await waitFor(() => expect(screen.getByText('Close List')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Close List'));
        expect(setShowSharedBy).toHaveBeenCalledWith(false);
    });

    it('closes tasks modal when close button clicked', () => {
        const setShowTasks = vi.fn();
        renderModals({ state: { showTasks: true, setShowTasks } });
        const closeBtn = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeBtn);
        expect(setShowTasks).toHaveBeenCalledWith(false);
    });
});
