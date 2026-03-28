import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../../../../pages/profile/Profile';
import analyticsService from '../../../../api/analyticsApi';
import { useProfileState, useProfileBodyData, useProfileContent } from '../../../../pages/profile/hooks/useProfile';
import { useProfileSummary } from '../../../../pages/profile/hooks/useProfileSummary';
import { useProfileVisibility } from '../../../../pages/profile/hooks/useProfileVisibility';
import { fetchApi } from '../../../../api/client';
import { createFnMap } from '../../../utils/testBuilderUtils';
const useAuthMock = vi.fn();
vi.mock('../../../../pages/profile/hooks/useProfile', () => ({
  useProfileState: vi.fn(),
  useProfileBodyData: vi.fn(),
  useProfileContent: vi.fn(),
}));
vi.mock('../../../../pages/profile/hooks/useProfileSummary', () => ({
  useProfileSummary: vi.fn(),
}));
vi.mock('../../../../pages/profile/hooks/useProfileVisibility', () => ({
  useProfileVisibility: vi.fn(),
}));
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));
vi.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({ mode: 'light' }),
}));
vi.mock('../../../../api/analyticsApi', () => ({
  default: { getSummary: vi.fn(() => Promise.resolve({ heatmap: { data: [] } })) },
}));
vi.mock('../../../../api/moduleApi', () => ({
  getModules: vi.fn(() => Promise.resolve([])),
}));
vi.mock('../../../../api/client', () => ({
  fetchApi: vi.fn(() => Promise.resolve({})),
}));
vi.mock('../../../../pages/profile/components/ProfileModals', () => ({
  default: () => <div data-testid="profile-modals" />,
}));
vi.mock('../../../../pages/profile/components/ProfileCalendar', () => ({
  ProfileCalendar: () => <div data-testid="profile-calendar" />,
}));
vi.mock('../../../../components/social/components/ShareButton', () => ({
  default: () => <button data-testid="share-button">Share</button>,
}));
vi.mock('../../../../pages/profile/components/AchievementsModal', () => ({
  default: ({ onClose }) => <div data-testid="achievements-modal"><button onClick={onClose}>Close</button></div>,
}));
const defaultUser = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith' };
const defaultProfileData = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith', year: 'Year 2', major: 'Physics', module_count: 3 };
const profileStateDefaults = {
  loading: false, profileData: defaultProfileData, events: [], viewedUserId: 1,
  showEditProfile: false, showModules: false, showTasks: false, showSharedWith: false,
  showSharedBy: false, showEvents: false, eventRange: 'week',
};
const makeProfileState = (overrides = {}) => ({
  ...profileStateDefaults,
  ...createFnMap(['onNavChange', 'setShowEditProfile', 'setShowModules', 'setShowTasks', 'setShowSharedWith', 'setShowSharedBy', 'setShowEvents', 'setEventRange', 'reload', 'handleSaveProfile']),
  ...overrides,
});
const defaultVisibility = {
  isSelf: true, isShared: false, canViewTasks: true, canViewEvents: true, canViewSharedWith: true,
  canViewAnalytics: true, canViewCalendar: false, canViewModules: true, canViewAchievements: true,
  canViewSocieties: true, canEditProfile: true,
};
const selfAnalyticsSummary = {
  persona: { emoji: '🦉', label: 'Night Owl', description: 'You work best late.' },
  badges: [{ id: 1, tier: 'gold', label: 'Focus Hero', emoji: '🏅', description: 'desc' }],
  weekly: { percentage: 45, hours_studied: 9, goal_hours: 20 }, streaks: { current: 2, longest: 5 },
  session_count: 1,
};
const renderProfile = (props = {}) => render(
  <MemoryRouter><Profile user={defaultUser} viewedUserId={1} onNavigate={vi.fn()} {...props}/></MemoryRouter>
);
const makeHeatmap = () => ({
  data: Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => (h === 10 && d === 0 ? 120 : 0))),
});
describe('Profile Analytics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({ profile: { modules: [] }, loading: false, authenticated: true, user: { role: 'student' }, refreshProfile: vi.fn() });
    useProfileState.mockReturnValue(makeProfileState());
    useProfileBodyData.mockReturnValue({ modules: ['CS101'], upcomingEventCount: 3, filteredEvents: [] });
    useProfileContent.mockImplementation((s) => ({ profileData: s.profileData, handlers: createFnMap(['onEditProfile', 'onModulesClick', 'onTasksClick', 'onEventsClick', 'onSharedWithClick', 'onSharedByClick', 'reload', 'setOptimisticShare']) }));
    useProfileSummary.mockReturnValue({ summary: { persona: null, badges: [], weekly: null, streaks: null }, loading: false, refetch: vi.fn() });
    useProfileVisibility.mockReturnValue(defaultVisibility);
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: [] } });
    fetchApi.mockResolvedValue({});
  });
  it('renders profile-home loading skeleton when summary is loading', () => {
    useProfileSummary.mockReturnValue({ summary: null, loading: true, refetch: vi.fn() });
    renderProfile();
    expect(document.querySelectorAll('[class*="skel"]').length).toBeGreaterThan(0);
  });

  it('renders self analytics blocks', async () => {
    analyticsService.getSummary.mockResolvedValue({ heatmap: makeHeatmap() });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    expect(await screen.findByText('Night Owl')).toBeTruthy();
    expect(screen.getByText('THIS WEEK')).toBeTruthy();
    expect(await screen.findByText('STUDY DNA')).toBeTruthy();
    expect(await screen.findByText('FOCUS HEATMAP')).toBeTruthy();
  });

  it('navigates to attendance details', async () => {
    const onNavigate = vi.fn();
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: [] } });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile({ onNavigate });
    const link = await screen.findByText(/View attendance details/i);
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith('attendance');
  });

  it('opens achievements modal', async () => {
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /View All/i }));
    expect(await screen.findByTestId('achievements-modal')).toBeTruthy();
  });

  it('closes achievements modal when Close clicked', async () => {
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    fireEvent.click(screen.getByRole('button', { name: /View All/i }));
    await screen.findByTestId('achievements-modal');
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => expect(screen.queryByTestId('achievements-modal')).not.toBeInTheDocument());
  });

  it('saves weekly goal and refetches summary', async () => {
    const refetch = vi.fn();
    useProfileSummary.mockReturnValue({ summary: { persona: null, badges: [], weekly: { percentage: 20, hours_studied: 2, goal_hours: 8 }, streaks: { current: 0, longest: 0 }, session_count: 1 }, loading: false, refetch });
    renderProfile();
    fireEvent.click(screen.getByText('2h').closest('button'));
    fireEvent.click(await screen.findByRole('button', { name: 'Save goal' }));
    await waitFor(() => expect(fetchApi).toHaveBeenCalledWith('/profile/', expect.objectContaining({ method: 'PATCH' })));
  });

  it('handles getSummary failure without crashing', async () => {
    analyticsService.getSummary.mockRejectedValue(new Error('error'));
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    await waitFor(() => expect(analyticsService.getSummary).toHaveBeenCalledWith(90));
    expect(screen.getByText('Night Owl')).toBeInTheDocument();
  });

  it('computePeakHour handles all zeros', async () => {
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: Array(7).fill(null).map(() => Array(24).fill(0)) } });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    await screen.findByText('Night Owl');
    expect(await screen.findByText('STUDY DNA')).toBeInTheDocument();
  });
});
