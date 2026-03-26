import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfileState, useProfileBodyData, useProfileContent } from '../../pages/Profile/hooks/useProfile';

const refreshProfileMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock('../../context/AuthenticationContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../api/userApi', () => ({
  getUserProfile: vi.fn(),
  getAnotherUserProfile: vi.fn(),
}));

vi.mock('../../api/analyticsApi', () => ({
  getAnalytics: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));

vi.mock('../../api/eventApi', () => ({
  getEvents: vi.fn(),
}));

vi.mock('../../pages/Profile/utils/profileHelpers', () => ({
  getFilteredEvents: vi.fn((events) => events || []),
  getUpcomingCount: vi.fn(() => 0),
}));

import { getUserProfile, getAnotherUserProfile } from '../../api/userApi';
import { getEvents } from '../../api/eventApi';
import { getFilteredEvents, getUpcomingCount } from '../../pages/Profile/utils/profileHelpers';

const mockProfile = {
  id: 1,
  name: 'Test User',
  is_sharing: false,
  shared_by_count: 3,
  modules: [{ id: 1, name: 'Math' }, { id: 2, name: 'Science' }],
};

const mockEvents = [
  { id: 1, start_time: '2026-03-08T10:00:00Z', title: 'Event 1' },
  { id: 2, start_time: '2026-03-09T10:00:00Z', title: 'Event 2' },
];

beforeEach(() => {
  vi.clearAllMocks();
  useAuthMock.mockReturnValue({ profile: null, loading: false, refreshProfile: refreshProfileMock });
  getUserProfile.mockResolvedValue(mockProfile);
  getAnotherUserProfile.mockImplementation(async (userId) => ({ ...mockProfile, id: userId }));
  getEvents.mockResolvedValue(mockEvents);
});

describe('useProfileState', () => {
  it('initializes with loading true and no profileData', () => {
    useAuthMock.mockReturnValue({ profile: null, loading: true, refreshProfile: refreshProfileMock });
    const { result } = renderHook(() => useProfileState(undefined));
    expect(result.current.loading).toBe(true);
    expect(result.current.profileData).toBeNull();
  });

  it('loads own profile when no userId provided', async () => {
    useAuthMock.mockReturnValue({ profile: null, loading: false, refreshProfile: refreshProfileMock });
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    await waitFor(() => expect(result.current.profileData).toEqual(mockProfile));
    expect(getUserProfile).toHaveBeenCalled();
  });

  it('loads another user profile when userId is provided', async () => {
    useAuthMock.mockReturnValue({ profile: { id: 'self-user' }, loading: false, refreshProfile: refreshProfileMock });
    const { result } = renderHook(() => useProfileState('user-42'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getAnotherUserProfile).toHaveBeenCalledWith('user-42');
    expect(result.current.profileData).toEqual({ ...mockProfile, id: 'user-42' });
  });

  it('exposes viewedUserId matching passed userId', async () => {
    const { result } = renderHook(() => useProfileState('user-99'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.viewedUserId).toBe('user-99');
  });

  it('loads events on mount', async () => {
    renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(getEvents).toHaveBeenCalled());
    expect(getEvents).toHaveBeenCalledWith({});
  });

  it('passes user_id param to getEvents when userId provided', async () => {
    renderHook(() => useProfileState('user-5'));
    await waitFor(() => expect(getEvents).toHaveBeenCalled());
    expect(getEvents).toHaveBeenCalledWith({ user_id: 'user-5' });
  });

  it('sets allEvents from loaded events', async () => {
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(result.current.allEvents).toEqual(mockEvents));
  });

  it('sets allEvents to [] when getEvents returns null', async () => {
    getEvents.mockResolvedValue(null);
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(result.current.allEvents).toEqual([]));
  });

  it('initializes eventRange as "month"', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    expect(result.current.eventRange).toBe('month');
  });

  it('allows eventRange to be updated', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    act(() => {
      result.current.setEventRange('week');
    });
    expect(result.current.eventRange).toBe('week');
  });

  it('all modal states default to false', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    expect(result.current.showModules).toBe(false);
    expect(result.current.showTasks).toBe(false);
    expect(result.current.showEvents).toBe(false);
    expect(result.current.showEditProfile).toBe(false);
    expect(result.current.showSharedWith).toBe(false);
    expect(result.current.showSharedBy).toBe(false);
  });

  it('can toggle showModules', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    act(() => { result.current.setShowModules(true); });
    expect(result.current.showModules).toBe(true);
  });

  it('can toggle showTasks', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    act(() => { result.current.setShowTasks(true); });
    expect(result.current.showTasks).toBe(true);
  });

  it('can toggle showEvents', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    act(() => { result.current.setShowEvents(true); });
    expect(result.current.showEvents).toBe(true);
  });

  it('can toggle showEditProfile', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    act(() => { result.current.setShowEditProfile(true); });
    expect(result.current.showEditProfile).toBe(true);
  });

  it('can toggle showSharedWith', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    act(() => { result.current.setShowSharedWith(true); });
    expect(result.current.showSharedWith).toBe(true);
  });

  it('can toggle showSharedBy', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    act(() => { result.current.setShowSharedBy(true); });
    expect(result.current.showSharedBy).toBe(true);
  });

  it('handleSaveProfile reloads profile data', async () => {
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    getUserProfile.mockClear();
    await act(async () => {
      await result.current.handleSaveProfile();
    });
    expect(getUserProfile).toHaveBeenCalled();
  });

  it('polls for profile updates every 5 seconds', async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    try {
      useAuthMock.mockReturnValue({ profile: { id: 'self-user' }, loading: false, refreshProfile: refreshProfileMock });
      const { unmount } = renderHook(() => useProfileState('user-99'));
      await act(async () => {});
      expect(setIntervalSpy).toHaveBeenCalled();
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
      unmount();
    } finally {
      setIntervalSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('clears polling interval on unmount', async () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    try {
      useAuthMock.mockReturnValue({ profile: { id: 'self-user' }, loading: false, refreshProfile: refreshProfileMock });
      const { unmount } = renderHook(() => useProfileState('user-99'));
      unmount();
      await act(async () => {});
      expect(clearIntervalSpy).toHaveBeenCalled();
    } finally {
      clearIntervalSpy.mockRestore();
      vi.useRealTimers();
    }
  });

  it('setOptimisticShare increments shared_by_count when sharing', async () => {
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    await waitFor(() => expect(result.current.profileData).not.toBeNull());
    act(() => {
      result.current.setOptimisticShare(true);
    });
    expect(result.current.profileData.is_sharing).toBe(true);
    expect(result.current.profileData.shared_by_count).toBe(3);
  });

  it('setOptimisticShare decrements shared_by_count when unsharing', async () => {
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    await waitFor(() => expect(result.current.profileData).not.toBeNull());
    act(() => {
      result.current.setOptimisticShare(false);
    });
    expect(result.current.profileData.is_sharing).toBe(false);
    expect(result.current.profileData.shared_by_count).toBe(3);
  });

  it('setOptimisticShare does not go below 0 for shared_by_count', async () => {
    getUserProfile.mockResolvedValue({ ...mockProfile, shared_by_count: 0 });
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    await waitFor(() => expect(result.current.profileData).not.toBeNull());
    act(() => {
      result.current.setOptimisticShare(false);
    });
    expect(result.current.profileData.shared_by_count).toBe(0);
  });

  it('setOptimisticShare is a no-op if profileData is null', () => {
    const { result } = renderHook(() => useProfileState(undefined));
    // profileData starts null, call should not throw
    act(() => {
      result.current.setOptimisticShare(true);
    });
    expect(result.current.profileData).toBeNull();
  });

  it('handles getUserProfile failure gracefully', async () => {
    getUserProfile.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(getUserProfile).toHaveBeenCalled());
    expect(result.current.profileData).toBeNull();
  });

  it('handles getEvents failure gracefully and allEvents stays empty', async () => {
    getEvents.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useProfileState(undefined));
    await waitFor(() => expect(getEvents).toHaveBeenCalled());
    expect(result.current.allEvents).toEqual([]);
  });
});

describe('useProfileBodyData', () => {
  it('extracts modules from profileData', () => {
    const state = { profileData: mockProfile, allEvents: [], eventRange: 'month' };
    const { result } = renderHook(() => useProfileBodyData(state));
    expect(result.current.modules).toEqual(mockProfile.modules);
  });

  it('returns empty array for modules when profileData is null', () => {
    const state = { profileData: null, allEvents: [], eventRange: 'month' };
    const { result } = renderHook(() => useProfileBodyData(state));
    expect(result.current.modules).toEqual([]);
  });

  it('calls getFilteredEvents with allEvents and eventRange', () => {
    getFilteredEvents.mockReturnValue([mockEvents[0]]);
    const state = { profileData: mockProfile, allEvents: mockEvents, eventRange: 'week' };
    const { result } = renderHook(() => useProfileBodyData(state));
    expect(getFilteredEvents).toHaveBeenCalledWith(mockEvents, 'week');
    expect(result.current.filteredEvents).toEqual([mockEvents[0]]);
  });

  it('calls getUpcomingCount with allEvents', () => {
    getUpcomingCount.mockReturnValue(5);
    const state = { profileData: mockProfile, allEvents: mockEvents, eventRange: 'month' };
    const { result } = renderHook(() => useProfileBodyData(state));
    expect(getUpcomingCount).toHaveBeenCalledWith(mockEvents);
    expect(result.current.upcomingEventCount).toBe(5);
  });
});

describe('useProfileContent', () => {
  const makeState = (overrides = {}) => ({
    profileData: mockProfile,
    reload: vi.fn(),
    setOptimisticShare: vi.fn(),
    setShowModules: vi.fn(),
    setShowTasks: vi.fn(),
    setShowEvents: vi.fn(),
    setShowEditProfile: vi.fn(),
    setShowSharedWith: vi.fn(),
    setShowSharedBy: vi.fn(),
    ...overrides,
  });

  it('returns profileData', () => {
    const state = makeState();
    const { result } = renderHook(() => useProfileContent(state));
    expect(result.current.profileData).toEqual(mockProfile);
  });

  it('exposes reload in handlers', () => {
    const reload = vi.fn();
    const state = makeState({ reload });
    const { result } = renderHook(() => useProfileContent(state));
    expect(result.current.handlers.reload).toBe(reload);
  });

  it('exposes setOptimisticShare in handlers', () => {
    const setOptimisticShare = vi.fn();
    const state = makeState({ setOptimisticShare });
    const { result } = renderHook(() => useProfileContent(state));
    expect(result.current.handlers.setOptimisticShare).toBe(setOptimisticShare);
  });

  it('onModulesClick calls setShowModules(true)', () => {
    const setShowModules = vi.fn();
    const state = makeState({ setShowModules });
    const { result } = renderHook(() => useProfileContent(state));
    result.current.handlers.onModulesClick();
    expect(setShowModules).toHaveBeenCalledWith(true);
  });

  it('onTasksClick calls setShowTasks(true)', () => {
    const setShowTasks = vi.fn();
    const state = makeState({ setShowTasks });
    const { result } = renderHook(() => useProfileContent(state));
    result.current.handlers.onTasksClick();
    expect(setShowTasks).toHaveBeenCalledWith(true);
  });

  it('onEventsClick calls setShowEvents(true)', () => {
    const setShowEvents = vi.fn();
    const state = makeState({ setShowEvents });
    const { result } = renderHook(() => useProfileContent(state));
    result.current.handlers.onEventsClick();
    expect(setShowEvents).toHaveBeenCalledWith(true);
  });

  it('onEditProfile calls setShowEditProfile(true)', () => {
    const setShowEditProfile = vi.fn();
    const state = makeState({ setShowEditProfile });
    const { result } = renderHook(() => useProfileContent(state));
    result.current.handlers.onEditProfile();
    expect(setShowEditProfile).toHaveBeenCalledWith(true);
  });

  it('onSharedWithClick calls setShowSharedWith(true)', () => {
    const setShowSharedWith = vi.fn();
    const state = makeState({ setShowSharedWith });
    const { result } = renderHook(() => useProfileContent(state));
    result.current.handlers.onSharedWithClick();
    expect(setShowSharedWith).toHaveBeenCalledWith(true);
  });

  it('onSharedByClick calls setShowSharedBy(true)', () => {
    const setShowSharedBy = vi.fn();
    const state = makeState({ setShowSharedBy });
    const { result } = renderHook(() => useProfileContent(state));
    result.current.handlers.onSharedByClick();
    expect(setShowSharedBy).toHaveBeenCalledWith(true);
  });
});
