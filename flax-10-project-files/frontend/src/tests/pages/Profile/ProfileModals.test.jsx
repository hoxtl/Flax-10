import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileModals, { SocietiesModal } from '../../../pages/profile/components/ProfileModals';
import { getModules } from '../../../api/moduleApi';
import { createFnMap } from '../../utils/testBuilderUtils';

vi.mock('../../../components/dashboard/EditProfileModal', () => ({
    default: ({ isOpen, onClose }) =>
        isOpen ? <div data-testid="edit-profile-modal"><button onClick={onClose}>Close Edit</button></div> : null,
}));

vi.mock('../../../components/social/UserListModal', () => ({
    default: ({ title, users, onClose, onUserClick, onUserCalendarClick, showCalendarAction }) => (
        <div data-testid="user-list-modal">
            <span>{title}</span>
            <button type="button" onClick={onClose}>Close List</button>
            {(users || []).map((u, i) => (
                <div key={i}>
                    <div data-testid="user-item" role="button" tabIndex={0} onClick={() => onUserClick?.(u)} onKeyDown={e => e.key === 'Enter' && onUserClick?.(u)}>
                        {u.username}
                    </div>
                    {showCalendarAction && (
                        <button type="button" onClick={() => onUserCalendarClick?.(u)}>
                            View calendar
                        </button>
                    )}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../api/socialApi', () => ({
    getSharingWith: vi.fn().mockResolvedValue([]),
    getSharedWithMe: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../api/moduleApi', () => ({
    getModules: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../api/taskApi', () => ({
    fetchTasks: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../pages/profile/hooks/useProfileModalsData', async () => {
    const actual = await vi.importActual('../../../pages/Profile/hooks/useProfileModalsData');
    return {
        ...actual,
        useTasksModalData: vi.fn(() => ({ loading: false, tasks: [] })),
    };
});

import { useTasksModalData } from '../../../pages/profile/hooks/useProfileModalsData';

const modalStateDefaults = {
    showEditProfile: false,
    profileData: { id: 1 },
    showModules: false,
    showTasks: false,
    showSharedWith: false,
    showSharedBy: false,
    showEvents: false,
    eventRange: 'week',
};

function makeState(overrides = {}) {
    return {
        ...modalStateDefaults,
        ...createFnMap(['setShowEditProfile', 'handleSaveProfile', 'setShowModules', 'setShowTasks', 'setShowSharedWith', 'setShowSharedBy', 'setShowEvents', 'setEventRange', 'reload']),
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

    it('renders mapped module names when they are available', async () => {
        vi.mocked(getModules).mockResolvedValueOnce({
            results: [
                { module_code: 'CS101', module_name: 'Intro to CS' },
            ],
        });

        renderModals({ state: { showModules: true }, modules: ['CS101'] });
        await waitFor(() => expect(screen.getByText('CS101 – Intro to CS')).toBeTruthy());
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

    it('renders task count and default task metadata when tasks are populated', async () => {
        useTasksModalData.mockReturnValueOnce({
            loading: false,
            tasks: [
                { id: 1, title: 'Read', completed: false, task_list_name: 'Week 1', due_date: null },
                { id: 2, title: 'Draft', completed: false, due_date: null },
            ],
        });

        renderModals({ state: { showTasks: true } });

        await waitFor(() => expect(screen.getByText('Tasks (2)')).toBeTruthy());
        expect(screen.getByText('No due date • Week 1')).toBeTruthy();
        expect(screen.getByText('No due date • Task')).toBeTruthy();
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
        fireEvent.click(screen.getByText('Today'));
        expect(setEventRange).toHaveBeenCalledWith('today');
    });

    it('does not render events modal when canViewEvents is false', () => {
        renderModals({ state: { showEvents: true }, visibility: { canViewEvents: false } });
        expect(screen.queryByText('Meeting')).toBeNull();
    });

    it('renders sharing modal when showSharedWith is true', async () => {
        const { getSharingWith } = await import('../../../api/socialApi');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);
        renderModals({ state: { showSharedWith: true } });
        await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
        expect(screen.getByText('1 person can see my calendar events')).toBeTruthy();
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

    it('modules modal still closes when navigation is unavailable', () => {
        const setShowModules = vi.fn();
        render(
            <ProfileModals
                user={defaultUser}
                state={makeState({ showModules: true, setShowModules })}
                modules={defaultModules}
                filteredEvents={defaultEvents}
                visibility={defaultVisibility}
                onNavChange={undefined}
            />
        );
        fireEvent.click(screen.getByText('CS101'));
        expect(setShowModules).toHaveBeenCalledWith(false);
    });

    it('renders Shared By modal when showSharedBy is true', async () => {
        const { getSharedWithMe } = await import('../../../api/socialApi');
        getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol' }]);
        renderModals({ state: { showSharedBy: true } });
        await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
        expect(screen.getByText('1 person has shared their calendar events with me')).toBeTruthy();
        expect(screen.getByRole('button', { name: /view calendar/i })).toBeTruthy();
    });

    it('renders plural titles for shared lists', async () => {
        const { getSharingWith, getSharedWithMe } = await import('../../../api/socialApi');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }, { id: 4, username: 'dana' }]);
        getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol' }, { id: 5, username: 'eli' }]);

        renderModals({ state: { showSharedWith: true } });
        await waitFor(() => expect(screen.getByText('2 people can see my calendar events')).toBeTruthy());

        renderModals({ state: { showSharedBy: true } });
        await waitFor(() => expect(screen.getByText('2 people have shared their calendar events with me')).toBeTruthy());
    });

    it('renders zero-count titles for empty shared lists', async () => {
        const { getSharingWith, getSharedWithMe } = await import('../../../api/socialApi');
        getSharingWith.mockResolvedValue([]);
        getSharedWithMe.mockResolvedValue([]);

        renderModals({ state: { showSharedWith: true } });
        await waitFor(() => expect(screen.getByText('People who can see my calendar events')).toBeTruthy());

        renderModals({ state: { showSharedBy: true } });
        await waitFor(() => expect(screen.getByText('People who have shared their calendar events with me')).toBeTruthy());
    });

    it('SocialDataModal handles fetch error', async () => {
        const { getSharingWith } = await import('../../../api/socialApi');
        getSharingWith.mockRejectedValueOnce(new Error('fetch failed'));
        renderModals({ state: { showSharedWith: true } });
        await waitFor(() => expect(getSharingWith).toHaveBeenCalled());
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
        const { getSharingWith } = await import('../../../api/socialApi');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);
        renderModals({ state: { showSharedWith: true, setShowSharedWith }, onNavChange });
        await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
        fireEvent.click(screen.getByText('bob'));
        expect(setShowSharedWith).toHaveBeenCalledWith(false);
        expect(onNavChange).toHaveBeenCalledWith('profile_2');
    });

    it('closes Shared With modal when Close List clicked', async () => {
        const setShowSharedWith = vi.fn();
        const { getSharingWith } = await import('../../../api/socialApi');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);
        renderModals({ state: { showSharedWith: true, setShowSharedWith } });
        await waitFor(() => expect(screen.getByText('Close List')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Close List'));
        expect(setShowSharedWith).toHaveBeenCalledWith(false);
    });

    it('closes Shared By modal when Close List clicked', async () => {
        const setShowSharedBy = vi.fn();
        const { getSharedWithMe } = await import('../../../api/socialApi');
        getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol' }]);
        renderModals({ state: { showSharedBy: true, setShowSharedBy } });
        await waitFor(() => expect(screen.getByText('Close List')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Close List'));
        expect(setShowSharedBy).toHaveBeenCalledWith(false);
    });

    it('opens a shared user calendar from the Sharing With Me modal', async () => {
        const onNavChange = vi.fn();
        const setShowSharedBy = vi.fn();
        const { getSharedWithMe } = await import('../../../api/socialApi');
        getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol', first_name: 'Carol', last_name: 'Stone' }]);
        renderModals({ state: { showSharedBy: true, setShowSharedBy }, onNavChange });
        await waitFor(() => expect(screen.getByRole('button', { name: /view calendar/i })).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /view calendar/i }));
        expect(setShowSharedBy).toHaveBeenCalledWith(false);
        expect(onNavChange).toHaveBeenCalledWith('/calendar?user_id=3&shared_name=Carol+Stone');
    });

    it('falls back to a Shared user label when the shared calendar owner has no name', async () => {
        const onNavChange = vi.fn();
        const { getSharedWithMe } = await import('../../../api/socialApi');
        getSharedWithMe.mockResolvedValue([{ id: 3 }]);

        renderModals({ state: { showSharedBy: true }, onNavChange });
        await waitFor(() => expect(screen.getByRole('button', { name: /view calendar/i })).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /view calendar/i }));
        expect(onNavChange).toHaveBeenCalledWith('/calendar?user_id=3&shared_name=Shared+user');
    });

    it('uses the username when the shared calendar owner has no names', async () => {
        const onNavChange = vi.fn();
        const { getSharedWithMe } = await import('../../../api/socialApi');
        getSharedWithMe.mockResolvedValue([{ id: 3, username: 'anonymous' }]);

        renderModals({ state: { showSharedBy: true }, onNavChange });
        await waitFor(() => expect(screen.getByRole('button', { name: /view calendar/i })).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /view calendar/i }));
        expect(onNavChange).toHaveBeenCalledWith('/calendar?user_id=3&shared_name=anonymous');
    });

    it('falls back to the plain calendar route when a shared user has no id', async () => {
        const onNavChange = vi.fn();
        const { getSharedWithMe } = await import('../../../api/socialApi');
        getSharedWithMe.mockResolvedValue([{ username: 'anonymous' }]);

        renderModals({ state: { showSharedBy: true }, onNavChange });
        await waitFor(() => expect(screen.getByRole('button', { name: /view calendar/i })).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /view calendar/i }));
        expect(onNavChange).toHaveBeenCalledWith('/calendar');
    });

    it('closes tasks modal when close button clicked', () => {
        const setShowTasks = vi.fn();
        renderModals({ state: { showTasks: true, setShowTasks } });
        const closeBtn = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeBtn);
        expect(setShowTasks).toHaveBeenCalledWith(false);
    });

    it('renders task subtitles with due date and fallback list labels', () => {
        useTasksModalData.mockReturnValueOnce({
            loading: false,
            tasks: [
                { id: 1, title: 'Essay draft', due_date: '2026-03-25T10:00:00Z', task_list_name: 'Seminar prep' },
                { title: 'Reading notes', due_date: null, list_name: 'Reading list' },
            ],
        });

        renderModals({ state: { showTasks: true } });

        expect(screen.getByText('Essay draft')).toBeTruthy();
        expect(screen.getByText('Reading notes')).toBeTruthy();
        expect(screen.getAllByText(/Seminar prep/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/No due date/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Reading list/).length).toBeGreaterThan(0);
    });

    it('uses the current user id when shared lists open without profileData', async () => {
        const onNavChange = vi.fn();
        const { getSharingWith } = await import('../../../api/socialApi');
        getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);

        render(
            <ProfileModals
                user={{ id: 9, username: 'alice' }}
                state={makeState({ profileData: null, showSharedWith: true })}
                modules={defaultModules}
                filteredEvents={defaultEvents}
                visibility={defaultVisibility}
                onNavChange={onNavChange}
            />
        );

        await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
        fireEvent.click(screen.getByText('bob'));
        expect(onNavChange).toHaveBeenCalledWith('profile_2');
    });

    it('renders SocietiesModal items and navigates to profiles and society pages', () => {
        const onNavigate = vi.fn();
        const onClose = vi.fn();

        render(
            <SocietiesModal
                isOpen
                onClose={onClose}
                societies={[
                    { id: 11, name: 'Chess Club', description: 'Weekly matches', cover_image: 'https://example.com/cover.png' },
                    { name: 'Mystery Society' },
                ]}
                onNavigate={onNavigate}
            />
        );

        expect(screen.getByText('Societies')).toBeTruthy();
        expect(screen.getByText('Chess Club')).toBeTruthy();
        expect(screen.getByText('Weekly matches')).toBeTruthy();
        expect(screen.getByAltText('Chess Club').getAttribute('src')).toContain('cover.png');

        fireEvent.click(screen.getByText('Chess Club'));
        expect(onClose).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalledWith('/societies?id=11');

        fireEvent.click(screen.getByText('Mystery Society'));
        expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it('uses society_id and image avatar fields when available', () => {
        const onNavigate = vi.fn();
        const onClose = vi.fn();

        render(
            <SocietiesModal
                isOpen
                onClose={onClose}
                societies={[
                    { society_id: 22, name: 'Film Club', image: 'https://example.com/film.png' },
                ]}
                onNavigate={onNavigate}
            />
        );

        expect(screen.getByAltText('Film Club').getAttribute('src')).toContain('film.png');
        fireEvent.click(screen.getByText('Film Club'));
        expect(onNavigate).toHaveBeenCalledWith('/societies?id=22');
    });

});
