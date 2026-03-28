import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../../../pages/profile/Profile';
import { useProfileState, useProfileBodyData, useProfileContent } from '../../../pages/profile/hooks/useProfile';
import { useProfileSummary } from '../../../pages/profile/hooks/useProfileSummary';
import { useProfileVisibility } from '../../../pages/profile/hooks/useProfileVisibility';
import { createFnMap } from '../../utils/testBuilderUtils';
const useAuthMock = vi.fn();
vi.mock('../../../pages/profile/hooks/useProfile', () => ({
  useProfileState: vi.fn(), useProfileBodyData: vi.fn(), useProfileContent: vi.fn(),
}));
vi.mock('../../../pages/profile/hooks/useProfileSummary', () => ({ useProfileSummary: vi.fn() }));
vi.mock('../../../pages/profile/hooks/useProfileVisibility', () => ({ useProfileVisibility: vi.fn() }));
vi.mock('../../../context/AuthContext', () => ({ useAuth: () => useAuthMock() }));
vi.mock('../../../context/ThemeContext', () => ({ useTheme: () => ({ mode: 'light' }) }));
vi.mock('../../../api/analyticsApi', () => ({ default: { getSummary: vi.fn(() => Promise.resolve({ heatmap: { data: [] } })) } }));
vi.mock('../../../api/moduleApi', () => ({ getModules: vi.fn(() => Promise.resolve([])) }));
vi.mock('../../../api/client', () => ({ fetchApi: vi.fn(() => Promise.resolve({})) }));
vi.mock('../../../pages/profile/components/ProfileModals', () => ({ default: () => <div data-testid="profile-modals" /> }));
vi.mock('../../../pages/profile/components/ProfileCalendar', () => ({ ProfileCalendar: () => <div data-testid="profile-calendar" /> }));
vi.mock('../../../components/social/components/ShareButton', () => ({ default: () => <button data-testid="share-button">Share</button> }));
vi.mock('../../../pages/profile/components/AchievementsModal', () => ({
  default: ({ onClose }) => <div data-testid="achievements-modal"><button onClick={onClose}>Close</button></div>,
}));
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
describe('Profile Layout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthMock.mockReturnValue({ profile: { modules: [] }, loading: false, authenticated: true, user: { role: 'student' }, refreshProfile: vi.fn() });
    useProfileState.mockReturnValue(makeProfileState());
    useProfileBodyData.mockReturnValue({ modules: ['CS101'], upcomingEventCount: 3, filteredEvents: [] });
    useProfileContent.mockImplementation((s) => ({ profileData: s.profileData, handlers: createFnMap(['onEditProfile', 'onModulesClick', 'onTasksClick', 'onEventsClick', 'onSharedWithClick', 'onSharedByClick', 'reload', 'setOptimisticShare']) }));
    useProfileSummary.mockReturnValue({ summary: { persona: null, badges: [], weekly: null, streaks: null }, loading: false, refetch: vi.fn() });
    useProfileVisibility.mockReturnValue(defaultVisibility);
  });
  it('uses teacher self layout', () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...defaultProfileData, role: 'teacher' } }));
    renderProfile();
    expect(document.querySelector('[class*="leftTopMetricsRowTeacher"]')).toBeTruthy();
  });

  it('renders teacher insights for another teacher', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData, role: 'teacher' }, viewedUserId: 2 }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewAnalytics: false, canViewCalendar: false });
    renderProfile({ viewedUserId: 2 });
    expect(await screen.findByText('CS101')).toBeInTheDocument();
  });

  it('renders common ground for students', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData, role: 'student' }, viewedUserId: 2 }));
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewAnalytics: false, canViewCalendar: false });
    renderProfile({ viewedUserId: 2 });
    expect(await screen.findByText('Common Ground')).toBeInTheDocument();
  });

  it('renders compatibility-only when no common ground', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData }, viewedUserId: 2 }));
    useProfileBodyData.mockReturnValue({ modules: [], upcomingEventCount: 0, filteredEvents: [] });
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewAnalytics: false, canViewCalendar: false });
    renderProfile({ viewedUserId: 2 });
    expect(await screen.findByText('Similar study times')).toBeInTheDocument();
    expect(screen.queryByText('Common Ground')).toBeNull();
  });

  it('renders compatibility score', async () => {
    useProfileState.mockReturnValue(makeProfileState({ profileData: { ...otherProfileData }, viewedUserId: 2 }));
    useProfileBodyData.mockReturnValue({ modules: [], upcomingEventCount: 0, filteredEvents: [] });
    useProfileSummary.mockReturnValue({ summary: { persona: null, badges: [], weekly: null, streaks: null, societies: [] }, loading: false, refetch: vi.fn() });
    useProfileVisibility.mockReturnValue({ ...defaultVisibility, isSelf: false, canViewAnalytics: false, canViewCalendar: false });
    renderProfile({ viewedUserId: 2 });
    expect(await screen.findByText('Similar study times')).toBeInTheDocument();
  });
});
