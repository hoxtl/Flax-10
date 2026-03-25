/**
 * Extra coverage tests for ProfileHeader uncovered branches and
 * useProfileHeaderState edge-cases not already exercised by existing tests.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks shared across all tests in this file
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_, tag) =>
        ({ children, ...props }) => {
          const rest = { ...props };
          ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'whileInView', 'variants', 'custom', 'layout'].forEach(
            (k) => delete rest[k],
          );
          return React.createElement(typeof tag === 'string' ? tag : 'div', rest, children);
        },
    },
  ),
}));

vi.mock('../../../pages/Profile/utils/profileHelpers', () => ({
  buildInitials: vi.fn((user) => {
    if (user?.first_name && user?.last_name) return `${user.first_name[0]}${user.last_name[0]}`;
    return '??';
  }),
  buildFullName: vi.fn((user) => {
    if (!user) return 'Guest';
    return user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest';
  }),
}));

vi.mock('../../../components/Social/ShareButton', () => ({
  default: ({ userId, onToggle, initialIsSharing }) => (
    <button data-testid="share-btn" onClick={() => onToggle?.(!initialIsSharing)}>
      Share {userId}
    </button>
  ),
}));

vi.mock('../../../components/common/PrimaryButton/PrimaryButton', () => ({
  default: ({ children, onClick, ...rest }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock('../../../utils/tutorPhotoFallback', () => ({
  getResolvedUserPhoto: (user) => {
    if (user?.profile_photo_url) return user.profile_photo_url;
    return '';
  },
}));

const fetchApiMock = vi.fn();
vi.mock('../../../api/client', () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

import ProfileHeader from '../../../pages/Profile/components/ProfileHeader';
import { useProfileHeaderState } from '../../../pages/Profile/useProfileHeaderState';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseHandlers = {
  onEditProfile: vi.fn(),
  onModulesClick: vi.fn(),
  onSharedWithClick: vi.fn(),
  onSharedByClick: vi.fn(),
  reload: vi.fn(),
  setOptimisticShare: vi.fn(),
};

const editableVisibility = {
  canViewModules: true,
  canViewSharedWith: true,
  canEditProfile: true,
};

const viewerVisibility = {
  canViewModules: false,
  canViewSharedWith: false,
  canEditProfile: false,
};

// ---------------------------------------------------------------------------
// ProfileHeader component tests – uncovered branches
// ---------------------------------------------------------------------------

describe('ProfileHeader – uncovered branches', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders initials fallback when no photo is provided', () => {
    render(
      <ProfileHeader
        user={{ username: 'bob', first_name: 'Bob', last_name: 'Bell' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    // With no photo, buildInitials result should appear (BB)
    expect(screen.getAllByText('BB').length).toBeGreaterThan(0);
  });

  it('shows societies stat when societyCount > 0 and canEditProfile', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 2 }}
        handlers={baseHandlers}
        visibility={editableVisibility}
        societies={[{ id: 1 }, { id: 2 }]}
        onSocietiesClick={vi.fn()}
      />,
    );
    expect(screen.getByText('societies')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2\s+societies/i })).toBeInTheDocument();
  });

  it('does NOT show societies stat when canEditProfile is false', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={viewerVisibility}
        societies={[{ id: 1 }, { id: 2 }]}
        onSocietiesClick={vi.fn()}
      />,
    );
    expect(screen.queryByText('societies')).not.toBeInTheDocument();
  });

  it('does NOT show societies stat when societyCount is 0', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        societies={[]}
        onSocietiesClick={vi.fn()}
      />,
    );
    expect(screen.queryByText('societies')).not.toBeInTheDocument();
  });

  it('shared-with stat appears only when canViewSharedWith', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ shared_with_count: 3, shared_by_count: 2 }}
        handlers={baseHandlers}
        visibility={{ ...editableVisibility, canViewSharedWith: true }}
      />,
    );
    expect(screen.getByText('shared')).toBeInTheDocument();
    expect(screen.getByText('sharing with me')).toBeInTheDocument();
  });

  it('shared-with stat is hidden when canViewSharedWith is false', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ shared_with_count: 5 }}
        handlers={baseHandlers}
        visibility={{ ...editableVisibility, canViewSharedWith: false }}
      />,
    );
    expect(screen.queryByText('shared')).not.toBeInTheDocument();
  });

  it('onSocietiesClick fires when societies stat is clicked', () => {
    const onSocietiesClick = vi.fn();
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 1 }}
        handlers={baseHandlers}
        visibility={editableVisibility}
        societies={[{ id: 1 }]}
        onSocietiesClick={onSocietiesClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /1\s+societies/i }));
    expect(onSocietiesClick).toHaveBeenCalled();
  });

  it('renders teacher description with "Department:" prefix', () => {
    render(
      <ProfileHeader
        user={{ username: 'prof', role: 'teacher' }}
        profileData={{ major: 'Mathematics' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    expect(screen.getAllByText('Department: Mathematics').length).toBeGreaterThan(0);
  });

  it('renders teacher role when role field is "teacher"', () => {
    render(
      <ProfileHeader
        user={{ username: 'prof', first_name: 'Alan', last_name: 'Turing', role: 'teacher' }}
        profileData={{ major: 'Computing' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    // Professor role label should appear in both desktop and mobile headers
    expect(screen.getAllByText('Professor').length).toBeGreaterThan(0);
  });

  it('renders badge tooltip on mouse enter', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[{ id: 'b1', emoji: '🎯', label: 'Marksman', description: 'Hit target' }]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
      />,
    );
    const emojiBtn = screen.getByText('🎯').closest('button');
    fireEvent.mouseEnter(emojiBtn);
    expect(screen.getByText('Marksman')).toBeInTheDocument();
    expect(screen.getByText('Hit target')).toBeInTheDocument();
  });

  it('renders "Tap to pin this badge" label in tooltip for editable profile', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[{ id: 'b2', emoji: '🔥', label: 'Flame', description: 'Hot streak' }]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
      />,
    );
    fireEvent.mouseEnter(screen.getByText('🔥').closest('button'));
    expect(screen.getByText('Tap to pin this badge')).toBeInTheDocument();
  });

  it('renders "Tap to unpin" in tooltip when badge is already pinned', () => {
    const badges = [
      { id: 'pinned1', emoji: '⭐', label: 'Star', description: 'Shines bright' },
      { id: 'other', emoji: '💡', label: 'Idea', description: 'Bright idea' },
    ];
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ pinned_badge_id: 'pinned1' }}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={badges}
        pinnedBadgeId="pinned1"
        onPinBadge={vi.fn()}
      />,
    );
    // The featured badge card has the unpin label
    expect(screen.getByText('Tap to unpin')).toBeInTheDocument();
  });

  it('renders persona inline chip with peak label', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        persona={{ emoji: '🦉', label: 'Night Owl', description: 'Burns midnight oil' }}
        peakHour={22}
      />,
    );
    expect(screen.getByText('Night Owl')).toBeInTheDocument();
    expect(screen.getByText('Burns midnight oil')).toBeInTheDocument();
    expect(screen.getByText('Based on your 10pm peak')).toBeInTheDocument();
  });

  it('renders persona inline chip with midnight peak (12am)', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        persona={{ emoji: '🌑', label: 'Midnight', description: 'Deep night' }}
        peakHour={0}
      />,
    );
    expect(screen.getByText('Based on your 12am peak')).toBeInTheDocument();
  });

  it('does not render persona chip when persona is null', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        persona={null}
        peakHour={null}
      />,
    );
    expect(screen.queryByText('Night Owl')).not.toBeInTheDocument();
  });

  it('does not render FeaturedBadgeCard when no badge is pinned', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[{ id: 'x', emoji: '💎', label: 'Diamond', description: 'Rare' }]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
      />,
    );
    // No featured badge card – no "Tap to unpin" text
    expect(screen.queryByText('Tap to unpin')).not.toBeInTheDocument();
    // The badge should still appear in the rail
    expect(screen.getByText('💎')).toBeInTheDocument();
  });

  it('renders ViewAll button and calls onViewAllBadges when clicked', () => {
    const onViewAllBadges = vi.fn();
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[
          { id: 'a', emoji: '🥇', label: 'Gold', description: 'd' },
          { id: 'b', emoji: '🥈', label: 'Silver', description: 'd' },
        ]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
        onViewAllBadges={onViewAllBadges}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /View All/i }));
    expect(onViewAllBadges).toHaveBeenCalled();
  });

  it('mobile header shows edit profile button', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('mobile header shows ShareButton when not editable', () => {
    render(
      <ProfileHeader
        user={{ id: 5, username: 'bob' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={viewerVisibility}
      />,
    );
    const shareBtns = screen.getAllByTestId('share-btn');
    expect(shareBtns.length).toBeGreaterThan(0);
  });

  it('mobile stats are hidden when canViewModules is false', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 5 }}
        handlers={baseHandlers}
        visibility={{ ...editableVisibility, canViewModules: false }}
      />,
    );
    // mobile stat grid should not appear
    expect(document.querySelector('[class*="mobileStatsGrid"]')).toBeNull();
  });

  it('mobile stats show module count when canViewModules and canEditProfile are both true', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 7 }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    const mobileModuleLabels = screen.getAllByText('Modules');
    expect(mobileModuleLabels.length).toBeGreaterThan(0);
  });

  it('SharedCalendarPill hidden when canEditProfile is true', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ is_shared_with_me: true }}
        handlers={baseHandlers}
        visibility={editableVisibility}
        onNavigate={vi.fn()}
      />,
    );
    // "Shared calendar with me" text should NOT appear in mobile pill when canEditProfile
    const pillElements = screen.queryAllByText('Shared calendar with me');
    // The desktop SharedCalendarActions won't render either (isShared requires !canEditProfile)
    expect(pillElements).toHaveLength(0);
  });

  it('HeaderAction fires onSharedWithClick correctly', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ shared_with_count: 4, shared_by_count: 1 }}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /4\s+shared/i }));
    expect(baseHandlers.onSharedWithClick).toHaveBeenCalled();
  });

  it('resolveBadgeLists: when > 4 badges and none pinned, shows 4 in rail', () => {
    const badges = Array.from({ length: 6 }, (_, i) => ({
      id: `b${i}`,
      emoji: `E${i}`,
      label: `Badge ${i}`,
      description: `desc ${i}`,
    }));
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={badges}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
      />,
    );
    // Indices 0-3 visible in rail (4 badges max when no pinned)
    expect(screen.getByText('E0')).toBeInTheDocument();
    expect(screen.getByText('E3')).toBeInTheDocument();
    // Badge 4 and 5 are outside the visible 4
    expect(screen.queryByText('E4')).not.toBeInTheDocument();
  });

  it('resolveBadgeLists: when badge is pinned, rail shows up to 3 others', () => {
    const badges = Array.from({ length: 5 }, (_, i) => ({
      id: `b${i}`,
      emoji: `E${i}`,
      label: `Badge ${i}`,
      description: `desc ${i}`,
    }));
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={badges}
        pinnedBadgeId="b0"
        onPinBadge={vi.fn()}
      />,
    );
    // b0 is featured, b1/b2/b3 in rail, b4 excluded
    expect(screen.queryByText('E4')).not.toBeInTheDocument();
    expect(screen.getByText('E1')).toBeInTheDocument();
    expect(screen.getByText('E3')).toBeInTheDocument();
  });

  it('empty badges array renders nothing', () => {
    const { container } = render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
        badges={[]}
        pinnedBadgeId=""
        onPinBadge={vi.fn()}
      />,
    );
    // No badge rail rendered
    expect(container.querySelector('[class*="headerBadgeRail"]')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// useProfileHeaderState – edge cases
// ---------------------------------------------------------------------------

describe('useProfileHeaderState – edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchApiMock.mockResolvedValue({});
  });

  it('setSocieties stores the new list', () => {
    const { result } = renderHook(() =>
      useProfileHeaderState({ pinned_badge_id: '' }, { canEditProfile: true }, vi.fn()),
    );
    act(() => result.current.setSocieties([{ id: 10, name: 'Drama' }]));
    expect(result.current.societies).toEqual([{ id: 10, name: 'Drama' }]);
  });

  it('pinnedBadgeId defaults to empty string when profileData is undefined', () => {
    const { result } = renderHook(() =>
      useProfileHeaderState(undefined, { canEditProfile: true }, vi.fn()),
    );
    expect(result.current.pinnedBadgeId).toBe('');
  });

  it('handlePinBadge is a no-op when reload is not provided', async () => {
    const { result } = renderHook(() =>
      useProfileHeaderState({ pinned_badge_id: '' }, { canEditProfile: true }, undefined),
    );
    await act(async () => {
      await result.current.handlePinBadge('x1');
    });
    expect(fetchApiMock).toHaveBeenCalledWith('/profile/', expect.objectContaining({ method: 'PATCH' }));
  });

  it('buildNextPinnedBadgeId toggles the same badge off (sets to empty string)', async () => {
    const reload = vi.fn();
    const { result } = renderHook(() =>
      useProfileHeaderState({ pinned_badge_id: 'abc' }, { canEditProfile: true }, reload),
    );
    await act(async () => {
      await result.current.handlePinBadge('abc');
    });
    expect(fetchApiMock).toHaveBeenCalledWith('/profile/', {
      method: 'PATCH',
      body: JSON.stringify({ pinned_badge_id: '' }),
    });
  });

  it('openAchievements / closeAchievements toggle independently', () => {
    const { result } = renderHook(() =>
      useProfileHeaderState({}, { canEditProfile: true }, vi.fn()),
    );
    expect(result.current.showAchievements).toBe(false);
    act(() => result.current.openAchievements());
    expect(result.current.showAchievements).toBe(true);
    act(() => result.current.closeAchievements());
    expect(result.current.showAchievements).toBe(false);
  });

  it('openSocieties / closeSocieties toggle independently', () => {
    const { result } = renderHook(() =>
      useProfileHeaderState({}, { canEditProfile: true }, vi.fn()),
    );
    expect(result.current.showSocieties).toBe(false);
    act(() => result.current.openSocieties());
    expect(result.current.showSocieties).toBe(true);
    act(() => result.current.closeSocieties());
    expect(result.current.showSocieties).toBe(false);
  });
});
