import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileModals from '../../../pages/Profile/ProfileModals';

vi.mock('../../../components/Dashboard/EditProfileModal', () => ({
    default: ({ isOpen, onClose }) =>
        isOpen ? <div data-testid="edit-profile-modal"><button onClick={onClose}>Close Edit</button></div> : null,
}));

vi.mock('../../../components/Social/UserListModal', () => ({
    default: ({ title, users, onClose }) => (
        <div data-testid="user-list-modal">
            <span>{title}</span>
            <button onClick={onClose}>Close List</button>
            {users.map((u, i) => <div key={i} data-testid="user-item">{u.username}</div>)}
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

    it('renders tasks modal when showTasks is true', () => {
        renderModals({ state: { showTasks: true } });
        expect(screen.getByText('Tasks')).toBeTruthy();
        expect(screen.getByText('Tasks feature coming soon...')).toBeTruthy();
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
        const closeBtn = screen.getAllByRole('button').find(b => b.textContent === '×');
        fireEvent.click(closeBtn);
        expect(setShowEvents).toHaveBeenCalledWith(false);
    });
});
