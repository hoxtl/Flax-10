/**
 * Integration-style tests for Profile rendering and profile actions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../../../pages/Profile/Profile';

// Mock hooks
vi.mock('../../../pages/Profile/hooks/useProfile', () => ({
  useProfileState: vi.fn(),
  useProfileBodyData: vi.fn(),
  useProfileContent: vi.fn(),
}));

vi.mock('../../../pages/Profile/hooks/useProfileSummary', () => ({
  useProfileSummary: vi.fn(),
}));

vi.mock('../../../pages/Profile/hooks/useProfileVisibility', () => ({
  useProfileVisibility: vi.fn(),
}));

// ProfileHome uses AuthContext's useAuth().
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    profile: { modules: [] },
    loading: false,
    authenticated: true,
    user: { role: 'student' },
    refreshProfile: vi.fn(),
  }),
}));

// StudyHeatmap + other analytics widgets depend on ThemeProvider via useTheme().
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({ mode: 'light' }),
}));

// Mock services
vi.mock('../../../api/analytics/analyticsApi', () => ({
  default: {
    getSummary: vi.fn(() => Promise.resolve({ heatmap: { data: [] } })),
  },
}));

vi.mock('../../../api/modules/moduleApi', () => ({
  getModules: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../api/client', () => ({
  fetchApi: vi.fn(() => Promise.resolve({})),
}));

// Mock components
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

import { useProfileState, useProfileBodyData, useProfileContent } from '../../../pages/Profile/hooks/useProfile';
import { useProfileSummary } from '../../../pages/Profile/hooks/useProfileSummary';
import { useProfileVisibility } from '../../../pages/Profile/hooks/useProfileVisibility';
import analyticsService from '../../../api/analytics/analyticsApi';
import { fetchApi } from '../../../api/client';

const defaultUser = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith' };
const defaultProfileData = { id: 1, username: 'alice', first_name: 'Alice', last_name: 'Smith', year: 'Year 2', major: 'Physics', module_count: 3 };
const otherProfileData = { id: 2, username: 'bob', first_name: 'Bob', last_name: 'Jones', year: 'Year 3', major: 'Chemistry' };

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

const defaultVisibility = {
  isSelf: true,
  isShared: false,
  canViewTasks: true,
  canViewEvents: true,
  canViewSharedWith: true,
  canViewAnalytics: true,
  canViewCalendar: false,
  canViewModules: true,
  canViewAchievements: true,
  canViewSocieties: true,
  canEditProfile: true,
};

const selfAnalyticsSummary = {
  persona: { emoji: '🦉', label: 'Night Owl', description: 'You work best late.' },
  badges: [{ id: 1, tier: 'gold', label: 'Focus Hero', emoji: '🏅', description: 'desc' }],
  weekly: { percentage: 45, hours_studied: 9, goal_hours: 20 },
  streaks: { current: 2, longest: 5 },
};

const renderProfile = (props = {}) =>
  render(
    <MemoryRouter>
      <Profile
        user={defaultUser}
        viewedUserId={1}
        onNavigate={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );

const makeHeatmap = () => ({
  data: Array.from({ length: 7 }, (_, day) => Array.from({ length: 24 }, (_, h) => (h === 10 && day === 0 ? 120 : 0))),
});

describe('Profile', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Set up default mock implementations
    useProfileState.mockReturnValue(makeProfileState());
    useProfileBodyData.mockReturnValue({
      modules: ['CS101'],
      upcomingEventCount: 3,
      filteredEvents: [],
    });
    useProfileContent.mockImplementation((state) => ({
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
    }));
    useProfileSummary.mockReturnValue({
      summary: { persona: null, badges: [], weekly: null, streaks: null },
      loading: false,
      refetch: vi.fn(),
    });
    useProfileVisibility.mockReturnValue(defaultVisibility);
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: [] } });
    fetchApi.mockResolvedValue({});
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
    useProfileSummary.mockReturnValue({
      summary: { persona: null, badges: [{ id: 1, name: 'Early Bird', tier: 'bronze', emoji: '🐦', label: 'Early Bird', description: '' }], weekly: null, streaks: null },
      loading: false,
      refetch: vi.fn(),
    });
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

  it('renders a standalone back button above the header when onBack is provided', async () => {
    const onBack = vi.fn();
    renderProfile({ onBack, backLabel: 'Go back' });
    fireEvent.click(screen.getByRole('button', { name: /Go back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
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

  it('opens analytics actions and achievements modal', async () => {
    const onNavigate = vi.fn();
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: Array(7).fill(null).map(() => Array(24).fill(0)) } });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile({ onNavigate });
    const analyticsLinks = await screen.findAllByText(/View (attendance details|full analytics)/i);
    fireEvent.click(analyticsLinks[0]);
    if (onNavigate.mock.calls.length === 0) {
      fireEvent.click(analyticsLinks[1]);
    }
    expect(onNavigate).toHaveBeenCalledWith('attendance');
    fireEvent.click(screen.getByRole('button', { name: /View All/i }));
    expect(await screen.findByTestId('achievements-modal')).toBeTruthy();
  });

  it('closes achievements modal when Close clicked', async () => {
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    analyticsService.getSummary.mockResolvedValue({ heatmap: { data: Array(7).fill(null).map(() => Array(24).fill(0)) } });
    renderProfile();
    await screen.findByText('Night Owl');
    fireEvent.click(screen.getByRole('button', { name: /View All/i }));
    await screen.findByTestId('achievements-modal');
    fireEvent.click(screen.getByText('Close'));
    await waitFor(() => expect(screen.queryByTestId('achievements-modal')).not.toBeInTheDocument());
  });

  it('saves weekly goal and refetches summary', async () => {
    fetchApi.mockResolvedValue({});
    useProfileSummary.mockReturnValue({
      summary: { persona: null, badges: [], weekly: { percentage: 20, hours_studied: 2, goal_hours: 8 }, streaks: { current: 0, longest: 0 } },
      loading: false,
      refetch: vi.fn(),
    });
    renderProfile();
    const goalRingBtns = screen.getAllByRole('button', { name: /2h\/8h/ });
    fireEvent.click(goalRingBtns[0]);
    const saveBtn = await screen.findByRole('button', { name: 'Save goal' });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(fetchApi).toHaveBeenCalledWith('/profile/', expect.objectContaining({ method: 'PATCH' })));
  });

  it('shows shared calendar for mutual profile', async () => {
    useProfileState.mockReturnValue(makeProfileState({
      profileData: { ...otherProfileData, is_shared_with_me: true },
      viewedUserId: 2,
    }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewCalendar: true });
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.getByText('SHARED CALENDAR')).toBeInTheDocument());
    expect(screen.getByTestId('profile-calendar')).toBeTruthy();
  });

  it('does not show shared calendar when viewing another profile without share', async () => {
    useProfileState.mockReturnValue(makeProfileState({
      profileData: { ...otherProfileData },
      viewedUserId: 2,
    }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewCalendar: false, canEditProfile: false });
    renderProfile({ user: defaultUser, viewedUserId: 2 });
    await waitFor(() => expect(screen.queryByText(/edit profile/i)).toBeNull());
    expect(screen.queryByText('SHARED CALENDAR')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-calendar')).not.toBeInTheDocument();
  });

  it('useProfileAnalytics handles getSummary failure without crashing', async () => {
    analyticsService.getSummary.mockRejectedValue(new Error('network error'));
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    await waitFor(() => expect(analyticsService.getSummary).toHaveBeenCalledWith(90));
    expect(screen.getByText('Night Owl')).toBeInTheDocument();
  });

  it('computePeakHour returns null when heatmap is all zeros', async () => {
    analyticsService.getSummary.mockResolvedValue({
      heatmap: { data: Array(7).fill(null).map(() => Array(24).fill(0)) },
    });
    useProfileSummary.mockReturnValue({ summary: selfAnalyticsSummary, loading: false, refetch: vi.fn() });
    renderProfile();
    await screen.findByText('Night Owl');
    expect(await screen.findByText('STUDY DNA')).toBeInTheDocument();
  });
});
