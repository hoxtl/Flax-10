/**
 * Extra coverage tests for ProfileHeader uncovered branches part 2 and
 * useProfileHeaderState edge-cases.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';

import {
  mockFramerMotion,
  mockProfileHelpers,
  mockSocialComponents,
  mockTutorPhotoFallback,
  baseHandlers,
  editableVisibility,
  viewerVisibility,
} from './ProfileTestUtils';

mockFramerMotion();
mockProfileHelpers();
mockSocialComponents();
mockTutorPhotoFallback();

const fetchApiMock = vi.fn();
vi.mock('../../../api/client', () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

import ProfileHeader from '../../../pages/profile/components/ProfileHeader';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/pages/profile/ProfileHeaderState.test.jsx
import { useProfileHeaderState } from '../../../pages/profile/hooks/useProfileHeaderState';
=======
import { useProfileHeaderState } from '../../../pages/profile/useProfileHeaderState';
>>>>>>> main:flax-10-project-files/frontend/src/tests/pages/Profile/ProfileHeaderState.test.jsx

// ProfileHeader component tests – part 2

describe('ProfileHeader – Part 2', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mobile header shows edit profile button', () => {
    render(<ProfileHeader user={{ username: 'a' }} profileData={{}} handlers={baseHandlers} visibility={editableVisibility} />);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('mobile header shows ShareButton when not editable', () => {
    render(<ProfileHeader user={{ id: 5, username: 'b' }} profileData={{}} handlers={baseHandlers} visibility={viewerVisibility} />);
    expect(screen.getAllByTestId('share-btn').length).toBeGreaterThan(0);
  });

  it('mobile stats are hidden when canViewModules is false', () => {
    render(<ProfileHeader user={{ username: 'a' }} profileData={{ module_count: 5 }} handlers={baseHandlers} visibility={{ ...editableVisibility, canViewModules: false }} />);
    expect(document.querySelector('[class*="mobileStatsGrid"]')).toBeNull();
  });

  it('mobile stats show module count when canViewModules and canEditProfile are true', () => {
    render(<ProfileHeader user={{ username: 'a' }} profileData={{ module_count: 7 }} handlers={baseHandlers} visibility={editableVisibility} />);
    expect(screen.getAllByText('Modules').length).toBeGreaterThan(0);
  });

  it('SharedCalendarPill hidden when canEditProfile is true', () => {
    render(<ProfileHeader user={{ username: 'a' }} profileData={{ is_shared_with_me: true }} handlers={baseHandlers} visibility={editableVisibility} onNavigate={vi.fn()} />);
    expect(screen.queryAllByText('Shared calendar with me')).toHaveLength(0);
  });

  it('HeaderAction fires onSharedWithClick correctly', () => {
    render(<ProfileHeader user={{ username: 'a' }} profileData={{ shared_with_count: 4, shared_by_count: 1 }} handlers={baseHandlers} visibility={editableVisibility} />);
    fireEvent.click(screen.getByRole('button', { name: /4\s+shared/i }));
    expect(baseHandlers.onSharedWithClick).toHaveBeenCalled();
  });

  it('resolveBadgeLists: when > 4 badges and none pinned, shows 4 in rail', () => {
    const badges = Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, emoji: `E${i}`, label: `Badge ${i}`, description: `d` }));
    render(<ProfileHeader user={{ username: 'a' }} profileData={{}} handlers={baseHandlers} visibility={editableVisibility} badges={badges} pinnedBadgeId="" onPinBadge={vi.fn()} />);
    expect(screen.getByText('E0')).toBeInTheDocument();
    expect(screen.getByText('E3')).toBeInTheDocument();
    expect(screen.queryByText('E4')).not.toBeInTheDocument();
  });

  it('resolveBadgeLists: when badge is pinned, rail shows up to 3 others', () => {
    const badges = Array.from({ length: 5 }, (_, i) => ({ id: `b${i}`, emoji: `E${i}`, label: `Badge ${i}`, description: `d` }));
    render(<ProfileHeader user={{ username: 'a' }} profileData={{}} handlers={baseHandlers} visibility={editableVisibility} badges={badges} pinnedBadgeId="b0" onPinBadge={vi.fn()} />);
    expect(screen.queryByText('E4')).not.toBeInTheDocument();
    expect(screen.getByText('E1')).toBeInTheDocument();
    expect(screen.getByText('E3')).toBeInTheDocument();
  });

  it('empty badges array renders nothing', () => {
    const { container } = render(<ProfileHeader user={{ username: 'a' }} profileData={{}} handlers={baseHandlers} visibility={editableVisibility} badges={[]} pinnedBadgeId="" onPinBadge={vi.fn()} />);
    expect(container.querySelector('[class*="headerBadgeRail"]')).toBeNull();
  });
});

// useProfileHeaderState – edge cases

describe('useProfileHeaderState – edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchApiMock.mockResolvedValue({});
  });

  it('setSocieties stores the new list', () => {
    const { result } = renderHook(() => useProfileHeaderState({ pinned_badge_id: '' }, { canEditProfile: true }, vi.fn()));
    act(() => result.current.setSocieties([{ id: 10, name: 'Drama' }]));
    expect(result.current.societies).toEqual([{ id: 10, name: 'Drama' }]);
  });

  it('pinnedBadgeId defaults to empty string when profileData is undefined', () => {
    const { result } = renderHook(() => useProfileHeaderState(undefined, { canEditProfile: true }, vi.fn()));
    expect(result.current.pinnedBadgeId).toBe('');
  });

  it('handlePinBadge sends patch request even if reload is missing', async () => {
    const { result } = renderHook(() => useProfileHeaderState({ pinned_badge_id: '' }, { canEditProfile: true }, undefined));
    await act(async () => { await result.current.handlePinBadge('x1'); });
    expect(fetchApiMock).toHaveBeenCalledWith('/profile/', expect.objectContaining({ method: 'PATCH' }));
  });

  it('handlePinBadge toggles same badge off', async () => {
    const reload = vi.fn();
    const { result } = renderHook(() => useProfileHeaderState({ pinned_badge_id: 'abc' }, { canEditProfile: true }, reload));
    await act(async () => { await result.current.handlePinBadge('abc'); });
    expect(fetchApiMock).toHaveBeenCalledWith('/profile/', { method: 'PATCH', body: JSON.stringify({ pinned_badge_id: '' }) });
  });

  it('open/close methods toggle state', () => {
    const { result } = renderHook(() => useProfileHeaderState({}, { canEditProfile: true }, vi.fn()));
    act(() => result.current.openAchievements());
    expect(result.current.showAchievements).toBe(true);
    act(() => result.current.closeAchievements());
    expect(result.current.showAchievements).toBe(false);
    act(() => result.current.openSocieties());
    expect(result.current.showSocieties).toBe(true);
    act(() => result.current.closeSocieties());
    expect(result.current.showSocieties).toBe(false);
  });
});
