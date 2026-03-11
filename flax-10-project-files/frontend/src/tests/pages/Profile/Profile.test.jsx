/**
 * Integration-style tests for Profile rendering and profile actions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Profile from '../../../pages/Profile/Profile';
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
const defaultProfileData = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith' };
const otherProfileData = { id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones' };

const makeProfileState = (overrides = {}) => ({
  loading: false,
  profileData: defaultProfileData,
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
  ...overrides,
});

const selfAnalyticsSummary = {
  persona: { emoji: '🦉', label: 'Night Owl', description: 'You work best late.' },
  badges: [{ id: 1, tier: 'gold', label: 'Focus Hero', emoji: '🏅', description: 'desc' }],
  weekly: { percentage: 45, hours_studied: 9, goal_hours: 20 },
  streaks: { current: 2, longest: 5 },
};

const renderProfile = (props = {}) =>
  render(
    <Profile
      user={defaultUser}
      viewedUserId={1}
      onNavigate={vi.fn()}
      {...props}
    />,
  );

const makeHeatmap = () => ({
  data: Array.from({ length: 7 }, (_, day) => Array.from({ length: 24 }, (_, h) => (h === 10 && day === 0 ? 120 : 0))),
});

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

  it('renders username', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText('modules')).toBeInTheDocument());
    const usernameEls = screen.getAllByText('alice');
    expect(usernameEls.length).toBeGreaterThan(0);
  });

  it('renders profile modals', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText('modules')).toBeInTheDocument());
    expect(screen.getByTestId('profile-modals')).toBeTruthy();
  });

  it('shows edit profile button for self', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText('modules')).toBeInTheDocument());
    expect(screen.getByText('Edit profile')).toBeTruthy();
  });

  it('renders module count', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText('modules')).toBeInTheDocument());
    expect(screen.getByText('modules')).toBeTruthy();
  });

  it('renders achievements section', async () => {
    useProfileSummary.mockReturnValueOnce({
      summary: { persona: null, badges: [{ id: 1, name: 'Early Bird', tier: 'bronze', emoji: '🐦', label: 'Early Bird', description: '' }], weekly: null, streaks: null },
      loading: false,
      refetch: vi.fn(),
    });
    renderProfile();
    await waitFor(() => expect(screen.getByText('modules')).toBeInTheDocument());
    expect(screen.getByText('ACHIEVEMENTS')).toBeTruthy();
  });

  it('shows Share button when viewing another profile', async () => {
    useProfileState.mockReturnValueOnce(makeProfileState({ profileData: { ...otherProfileData }, viewedUserId: 2 }));
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.getAllByTestId('share-button').length).toBeGreaterThan(0));
    expect(screen.queryByText('Edit profile')).toBeNull();
  });

  it('renders profile-home loading skeleton when summary is loading', () => {
    useProfileSummary.mockReturnValueOnce({ summary: null, loading: true, refetch: vi.fn() });
    renderProfile();
    expect(document.querySelectorAll('[class*="skel"]').length).toBeGreaterThan(0);
  });

  it('renders self analytics blocks', async () => {
    analyticsService.getSummary.mockResolvedValueOnce({ heatmap: makeHeatmap() });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    expect(await screen.findByText('Night Owl')).toBeTruthy();
    expect(screen.getByText('THIS WEEK')).toBeTruthy();
    expect(screen.getByText('STUDY DNA')).toBeTruthy();
    expect(screen.getByText('STUDY ACTIVITY')).toBeTruthy();
  });

  it('opens analytics actions and achievements modal', async () => {
    const onNavigate = vi.fn();
    const { default: analyticsService } = await import('../../../api/analyticsService');
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: Array(7).fill(null).map(() => Array(24).fill(0)) } });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile({ onNavigate });
    const analyticsLink = await screen.findByText('View full analytics');
    fireEvent.click(analyticsLink);
    expect(onNavigate).toHaveBeenCalledWith('analytics');
    fireEvent.click(screen.getByText('ACHIEVEMENTS'));
    expect(await screen.findByTestId('achievements-modal')).toBeTruthy();
  });

  it('closes achievements modal when Close clicked', async () => {
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    const { default: analyticsService } = await import('../../../api/analyticsService');
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: Array(7).fill(null).map(() => Array(24).fill(0)) } });
    renderProfile();
    await screen.findByText('Night Owl');
    fireEvent.click(screen.getByText('ACHIEVEMENTS'));
    await screen.findByTestId('achievements-modal');
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => expect(screen.queryByTestId('achievements-modal')).not.toBeInTheDocument());
  });

  it('saves weekly goal and refetches summary', async () => {
    fetchApi.mockResolvedValueOnce({});
    useProfileSummary.mockReturnValueOnce({
      summary: { persona: null, badges: [], weekly: { percentage: 20, hours_studied: 2, goal_hours: 8 }, streaks: { current: 0, longest: 0 } },
      loading: false,
      refetch: vi.fn(),
    });
    renderProfile();
    const goalRingBtn = screen.getByRole('button', { name: /2h\/8h/ });
    fireEvent.click(goalRingBtn);
    const saveBtn = await screen.findByRole('button', { name: 'Save goal' });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(fetchApi).toHaveBeenCalledWith('/profile/', expect.objectContaining({ method: 'PATCH' })));
  });

  it('shows shared calendar for mutual profile', async () => {
    useProfileState.mockReturnValueOnce(makeProfileState({
      profileData: { ...otherProfileData, is_shared_with_me: true },
      viewedUserId: 2,
    }));
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.getByText('SHARED CALENDAR')).toBeInTheDocument());
    expect(screen.getByTestId('profile-calendar')).toBeTruthy();
  });

  it('does not show shared calendar when viewing another profile without share', async () => {
    useProfileState.mockReturnValueOnce(makeProfileState({
      profileData: { ...otherProfileData },
      viewedUserId: 2,
    }));
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.queryByText('Edit profile')).toBeNull());
    expect(screen.queryByText('SHARED CALENDAR')).toBeNull();
    expect(screen.queryByTestId('profile-calendar')).toBeNull();
  });

  it('useProfileAnalytics handles getSummary failure without crashing', async () => {
    const { default: analytics } = await import('../../../api/analyticsService');
    analytics.getSummary.mockRejectedValueOnce(new Error('network error'));
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    await waitFor(() => expect(analytics.getSummary).toHaveBeenCalledWith(90));
    expect(screen.getByText('Night Owl')).toBeInTheDocument();
  });

  it('computePeakHour returns null when heatmap is all zeros', async () => {
    const { default: analytics } = await import('../../../api/analyticsService');
    analytics.getSummary.mockResolvedValueOnce({
      heatmap: { data: Array(7).fill(null).map(() => Array(24).fill(0)) },
    });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    await screen.findByText('Night Owl');
    expect(screen.getByText('STUDY DNA')).toBeInTheDocument();
  });
});
