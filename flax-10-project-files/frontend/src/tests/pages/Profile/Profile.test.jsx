import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Profile from '../../../pages/Profile/Profile';

// Mock all hooks and sub-components to keep tests isolated

vi.mock('../../../pages/Profile/hooks/useProfile', () => ({
    useProfileState: vi.fn(() => ({
        loading: false,
        profileData: { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith' },
        events: [],
        viewedUserId: 1,
        onNavChange: vi.fn(),
        showEditProfile: false,
        setShowEditProfile: vi.fn(),
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
        handleSaveProfile: vi.fn(),
    })),
    useProfileBodyData: vi.fn(() => ({
        modules: ['CS101'],
        upcomingEventCount: 3,
        filteredEvents: [],
    })),
    useProfileContent: vi.fn((state) => ({
        profileData: state.profileData,
        handlers: {
            onEditProfile: vi.fn(),
            onModulesClick: vi.fn(),
            onTasksClick: vi.fn(),
            onEventsClick: vi.fn(),
            onSharedWithClick: vi.fn(),
            onSharedByClick: vi.fn(),
            reload: vi.fn(),
            setOptimisticShare: vi.fn(),
        },
    })),
}));

vi.mock('../../../pages/Profile/hooks/useProfileSummary', () => ({
    useProfileSummary: vi.fn(() => ({
        summary: { persona: null, badges: [], weekly: null, streaks: null },
        loading: false,
        refetch: vi.fn(),
    })),
}));

vi.mock('../../../api/analyticsService', () => ({
    default: { getSummary: vi.fn().mockResolvedValue(null) },
}));

vi.mock('../../../api/moduleApi', () => ({
    getModules: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../api/client', () => ({
    fetchApi: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../pages/Profile/ProfileModals', () => ({
    default: () => <div data-testid="profile-modals" />,
}));

vi.mock('../../../pages/Profile/ProfileCalendar', () => ({
    ProfileCalendar: () => <div data-testid="profile-calendar" />,
}));

vi.mock('../../../components/Social/ShareButton', () => ({
    default: () => <button data-testid="share-button">Share</button>,
}));

vi.mock('../../../pages/Profile/AchievementsModal', () => ({
    default: ({ onClose }) => <div data-testid="achievements-modal"><button onClick={onClose}>Close</button></div>,
}));

import { useProfileState } from '../../../pages/Profile/hooks/useProfile';

const defaultUser = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith' };

function renderProfile(props = {}) {
    return render(
        <Profile
            user={defaultUser}
            viewedUserId={1}
            onNavigate={vi.fn()}
            {...props}
        />
    );
}

describe('Profile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state', () => {
        useProfileState.mockReturnValueOnce({ loading: true });
        renderProfile();
        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('renders not found when no profileData', () => {
        useProfileState.mockReturnValueOnce({ loading: false, profileData: null });
        renderProfile();
        expect(screen.getByText('User not found.')).toBeTruthy();
    });

    it('renders username', () => {
        renderProfile();
        const usernameEls = screen.getAllByText('alice');
        expect(usernameEls.length).toBeGreaterThan(0);
    });

    it('renders profile modals', () => {
        renderProfile();
        expect(screen.getByTestId('profile-modals')).toBeTruthy();
    });

    it('shows edit profile button for self', () => {
        renderProfile();
        expect(screen.getByText('Edit profile')).toBeTruthy();
    });

    it('renders module count', () => {
        renderProfile();
        // StatItem shows module_count
        expect(screen.getByText('modules')).toBeTruthy();
    });
});
