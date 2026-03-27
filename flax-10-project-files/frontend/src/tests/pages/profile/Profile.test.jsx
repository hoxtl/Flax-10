import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../../../pages/profile/Profile';

import { createFnMap } from '../../utils/testBuilderUtils';
const useAuthMock = vi.fn();

vi.mock('../../../pages/profile/hooks/useProfile', () => ({
  useProfileState: vi.fn(),
  useProfileBodyData: vi.fn(),
  useProfileContent: vi.fn(),
}));

vi.mock('../../../pages/profile/hooks/useProfileSummary', () => ({
  useProfileSummary: vi.fn(),
}));

vi.mock('../../../pages/profile/hooks/useProfileVisibility', () => ({
  useProfileVisibility: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ mode: 'light' }),
}));

vi.mock('../../../api/analyticsApi', () => ({
  default: {
    getSummary: vi.fn(() => Promise.resolve({ heatmap: { data: [] } })),
  },
}));

vi.mock('../../../api/moduleApi', () => ({
  getModules: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/client', () => ({
  fetchApi: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../../pages/profile/ProfileModals', () => ({
  default: () => <div data-testid="profile-modals" />,
}));

vi.mock('../../../pages/profile/ProfileCalendar', () => ({
  ProfileCalendar: () => <div data-testid="profile-calendar" />,
}));

vi.mock('../../../components/social/ShareButton', () => ({
  default: () => <button data-testid="share-button">Share</button>,
}));

vi.mock('../../../pages/profile/AchievementsModal', () => ({
  default: ({ onClose }) => <div data-testid="achievements-modal"><button onClick={onClose}>Close</button></div>,
}));

import { useProfileState, useProfileBodyData, useProfileContent } from '../../../pages/profile/hooks/useProfile';
import { useProfileSummary } from '../../../pages/profile/hooks/useProfileSummary';
import { useProfileVisibility } from '../../../pages/profile/hooks/useProfileVisibility';
import analyticsService from '../../../api/analyticsApi';
import { fetchApi } from '../../../api/client';

const defaultUser = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith' };
const defaultProfileData = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith', year: 'Year 2', major: 'Physics', module_count: 3 };
const otherProfileData = { id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones', year: 'Year 3', major: 'Chemistry' };
const profileStateDefaults = {
  loading: false, profileData: defaultProfileData, events: [], viewedUserId: 1, showEditProfile: false,
  showModules: false, showTasks: false, showSharedWith: false, showSharedBy: false, showEvents: false, eventRange: 'week',
};
const makeProfileState = (o = {}) => ({
  ...profileStateDefaults, ...createFnMap(['onNavChange', 'setShowEditProfile', 'setShowModules', 'setShowTasks', 'setShowSharedWith', 'setShowSharedBy', 'setShowEvents', 'setEventRange', 'reload', 'handleSaveProfile']), ...o,
});
const defaultVisibility = {
  isSelf: true, isShared: false, canViewTasks: true, canViewEvents: true, canViewSharedWith: true,
  canViewAnalytics: true, canViewCalendar: false, canViewModules: true, canViewAchievements: true,
  canViewSocieties: true, canEditProfile: true,
};
const renderProfile = (p = {}) => render(
  <MemoryRouter><Profile user={defaultUser} viewedUserId={1} onNavigate={vi.fn()} {...p}/></MemoryRouter>
);
describe('Profile Core', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({ profile: { modules: [] }, loading: false, authenticated: true, user: { role: 'student' }, refreshProfile: vi.fn() });
    useProfileState.mockReturnValue(makeProfileState());
    useProfileBodyData.mockReturnValue({ modules: ['CS101'], upcomingEventCount: 3, filteredEvents: [] });
    useProfileContent.mockImplementation((s) => ({ profileData: s.profileData, handlers: createFnMap(['onEditProfile', 'onModulesClick', 'onTasksClick', 'onEventsClick', 'onSharedWithClick', 'onSharedByClick', 'reload', 'setOptimisticShare']) }));
    useProfileSummary.mockReturnValue({ summary: { persona: null, badges: [], weekly: null, streaks: null }, loading: false, refetch: vi.fn() });
    useProfileVisibility.mockReturnValue(defaultVisibility);
  });
  it('renders loading state', () => {
    useProfileState.mockReturnValue(makeProfileState({ loading: true }));
    renderProfile();
    expect(document.querySelectorAll('[class*="skel"]').length).toBeGreaterThan(0);
  });
  it('renders not found when no profileData', () => {
    useProfileState.mockReturnValue(makeProfileState({ loading: false, profileData: null }));
    renderProfile({ user: null });
    expect(screen.getByText('Profile unavailable')).toBeTruthy();
  });
  it('renders username', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByText('alice').length).toBeGreaterThan(0));
  });
  it('renders profile modals', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByTestId('profile-modals')).toBeTruthy());
  });
  it('shows edit profile button for self', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByText(/edit profile/i).length).toBeGreaterThan(0));
  });
  it('renders module count', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getAllByText(/modules/i).length).toBeGreaterThan(0));
  });
  it('renders achievements section', async () => {
    useProfileSummary.mockReturnValue({ summary: { persona: null, badges: [{ id: 1, name: 'Early Bird', tier: 'bronze', emoji: '🐦', label: 'Early Bird', description: '' }], weekly: null, streaks: null }, loading: false, refetch: vi.fn() });
    renderProfile();
    await waitFor(() => expect(screen.getByRole('button', { name: /View All/i })).toBeTruthy());
  });
  it('shows Share button when viewing another profile', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData }, viewedUserId: 2 }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canEditProfile: false });
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.getAllByTestId('share-button').length).toBeGreaterThan(0));
    expect(screen.queryByText(/edit profile/i)).toBeNull();
  });
  it('falls back to the current user object when profileData is missing', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: null, viewedUserId: 1 }));
    renderProfile({ user: defaultUser, viewedUserId: 1 });
    expect((await screen.findAllByText('alice')).length).toBeGreaterThan(0);
  });
  it('falls back to empty auth modules', async () => {
    const auth = { profile: null, loading: false, authenticated: true, user: { role: 'student' }, refreshProfile: vi.fn() };
    useAuthMock.mockReturnValue(auth);
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData, is_shared_with_me: true }, viewedUserId: 2, filteredEvents: undefined }));
    useProfileBodyData.mockReturnValue({ modules: undefined, upcomingEventCount: 0, filteredEvents: undefined });
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewCalendar: true, canViewAnalytics: false });
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    expect(await screen.findByText('SHARED CALENDAR')).toBeInTheDocument();
  });
  it('falls back to onNavChange when onNavigate is missing', async () => {
    const onNavChange = vi.fn();
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData, is_shared_with_me: true }, viewedUserId: 2 }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewCalendar: true, canEditProfile: false });
    renderProfile({ user: defaultUser, viewedUserId: 2, onNavigate: undefined, onNavChange });
    fireEvent.click(await screen.findByText('View their calendar'));
    expect(onNavChange).toHaveBeenCalled();
  });
  it('renders a standalone back button when onBack is provided', async () => {
    const onBack = vi.fn();
    renderProfile({ onBack, backLabel: 'Go back' });
    fireEvent.click(screen.getByRole('button', { name: /Go back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
  it('shows shared calendar for mutual profile', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData, is_shared_with_me: true }, viewedUserId: 2 }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewCalendar: true });
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.getByText('SHARED CALENDAR')).toBeInTheDocument());
    expect(screen.getByTestId('profile-calendar')).toBeTruthy();
  });
  it('does not show shared calendar without share', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData }, viewedUserId: 2 }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewCalendar: false, canEditProfile: false });
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.queryByText(/edit profile/i)).toBeNull());
    expect(screen.queryByText('SHARED CALENDAR')).not.toBeInTheDocument();
  });
});
