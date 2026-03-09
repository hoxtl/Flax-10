import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import { useProfileSummary } from '../../../pages/Profile/hooks/useProfileSummary';
import analyticsService from '../../../api/analyticsService';
import { fetchApi } from '../../../api/client';

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

    it('renders achievements section', () => {
        useProfileSummary.mockReturnValueOnce({
            summary: { persona: null, badges: [{ id: 1, name: 'Early Bird', tier: 'bronze', emoji: '🐦', label: 'Early Bird', description: '' }], weekly: null, streaks: null },
            loading: false,
            refetch: vi.fn(),
        });
        renderProfile();
        expect(screen.getByText('ACHIEVEMENTS')).toBeTruthy();
    });

    it('shows Share button when viewing other user profile', () => {
        useProfileState.mockReturnValueOnce({
            loading: false,
            profileData: { id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones' },
            events: [],
            viewedUserId: 2,
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
        });
        renderProfile({ user: defaultUser, viewedUserId: 2 });
        expect(screen.getAllByTestId('share-button').length).toBeGreaterThan(0);
        expect(screen.queryByText('Edit profile')).toBeNull();
    });

    it('renders profile-home loading skeleton when summary is loading', () => {
        useProfileSummary.mockReturnValueOnce({
            summary: null,
            loading: true,
            refetch: vi.fn(),
        });
        renderProfile();
        expect(document.querySelectorAll('[class*="skel"]').length).toBeGreaterThan(0);
    });

    it('renders self analytics blocks, opens achievements modal, and navigates to analytics', async () => {
        const onNavigate = vi.fn();
        analyticsService.getSummary.mockResolvedValueOnce({
            heatmap: {
                data: Array.from({ length: 7 }, (_, day) => Array.from({ length: 24 }, (_, h) => (h === 10 && day === 0 ? 120 : 0))),
            },
        });
        useProfileSummary.mockReturnValue({
            summary: {
                persona: { emoji: '🦉', label: 'Night Owl', description: 'You work best late.' },
                badges: [
                    { id: 1, tier: 'gold', label: 'Focus Hero', emoji: '🏅', description: 'desc' },
                    { id: 2, tier: 'silver', label: 'Streak', emoji: '🔥', description: 'desc' },
                ],
                weekly: { percentage: 45, hours_studied: 9, goal_hours: 20 },
                streaks: { current: 2, longest: 5 },
            },
            loading: false,
            refetch: vi.fn(),
        });

        renderProfile({ onNavigate });

        expect(await screen.findByText('Night Owl')).toBeTruthy();
        expect(screen.getByText('THIS WEEK')).toBeTruthy();
        expect(screen.getByText('STUDY DNA')).toBeTruthy();
        expect(screen.getByText('STUDY ACTIVITY')).toBeTruthy();
        expect(screen.getByText('ACHIEVEMENTS')).toBeTruthy();

        fireEvent.click(screen.getByLabelText('Go to full analytics'));
        expect(onNavigate).toHaveBeenCalledWith('analytics');

        fireEvent.click(screen.getByText('ACHIEVEMENTS'));
        expect(await screen.findByTestId('achievements-modal')).toBeTruthy();
    });

    it('saves weekly goal and refetches summary', async () => {
        const refetch = vi.fn();
        fetchApi.mockResolvedValueOnce({});
        useProfileSummary.mockReturnValueOnce({
            summary: {
                persona: null,
                badges: [],
                weekly: { percentage: 20, hours_studied: 2, goal_hours: 8 },
                streaks: { current: 0, longest: 0 },
            },
            loading: false,
            refetch,
        });

        renderProfile();

        fireEvent.click(screen.getByLabelText('Edit weekly goal'));
        fireEvent.click(screen.getByText('Save goal'));

        await waitFor(() => {
            expect(fetchApi).toHaveBeenCalledWith('/profile/', expect.objectContaining({ method: 'PATCH' }));
            expect(refetch).toHaveBeenCalled();
        });
    });

    it('shows shared calendar for non-self mutual profile', () => {
        useProfileState.mockReturnValueOnce({
            loading: false,
            profileData: { id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones', is_shared_with_me: true },
            events: [],
            viewedUserId: 2,
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
        });

        renderProfile({ user: defaultUser, viewedUserId: 2 });
        expect(screen.getByText('SHARED CALENDAR')).toBeTruthy();
        expect(screen.getByTestId('profile-calendar')).toBeTruthy();
    });
});
