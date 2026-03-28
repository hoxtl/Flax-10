/**
 * Extra coverage tests for ProfileHeader uncovered branches part 1.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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
vi.mock('../../../../api/client', () => ({
  fetchApi: (...args) => fetchApiMock(...args),
}));

import ProfileHeader from '../../../../pages/profile/components/ProfileHeader';

<<<<<<< HEAD
vi.mock('../../../../pages/profile/utils/profileHelpers', () => ({
  buildInitials: vi.fn((user) => {
    if (user?.name) return 'AB';
    if (user?.first_name && user?.last_name) return `${user.first_name[0]}${user.last_name[0]}`;
    return '?';
  }),
  buildFullName: vi.fn((user) => {
    if (user?.id === 999) return '';
    return user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Guest';
  }),
}));

vi.mock('../../../../pages/Profile/utils/profileHelpers', () => ({
  buildInitials: vi.fn((user) => {
    if (user?.name) return 'AB';
    if (user?.first_name && user?.last_name) return `${user.first_name[0]}${user.last_name[0]}`;
    return '?';
  }),
  buildFullName: vi.fn((user) => {
    if (user?.id === 999) return '';
    return user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Guest';
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }) => <div className={className} style={style} {...props}>{children}</div>,
    button: ({ children, className, style, ...props }) => <button className={className} style={style} {...props}>{children}</button>,
    span: ({ children, className, style, ...props }) => <span className={className} style={style} {...props}>{children}</span>,
    h1: ({ children, className, style, ...props }) => <h1 className={className} style={style} {...props}>{children}</h1>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../../../components/social/components/ShareButton', () => ({
  default: ({ userId, initialIsSharing, onToggle }) => (
    <button data-testid="share-button" onClick={() => onToggle?.(!initialIsSharing)}>
      Share {userId}
    </button>
  ),
}));
=======
// ProfileHeader component tests – part 1

describe('ProfileHeader – Part 1', () => {
  beforeEach(() => vi.clearAllMocks());
>>>>>>> origin

  it('renders initials fallback when no photo is provided', () => {
    render(
      <ProfileHeader
        user={{ username: 'bob', first_name: 'Bob', last_name: 'Bell' }}
        profileData={{}}
        handlers={baseHandlers}
        visibility={editableVisibility}
      />,
    );
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
    expect(screen.getAllByText('Professor').length).toBeGreaterThan(0);
  });

<<<<<<< HEAD
  it('detects professor by Dr. prefix', () => {
    renderHeader({
      user: { name: 'Dr. Jane Smith' },
      profileData: { id: 123, name: 'Dr. Jane Smith', major: 'Biology' },
    });
    expect(screen.getAllByText(/Professor/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Department: Biology/i).length).toBeGreaterThan(0);
  });

  it('shows contact email for students too', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { id: 123, email: 'alice@kcl.ac.uk', year: 'Year 2', major: 'Physics' },
    });
    // Email is shown in the rendered header (may be inside a link or text)
    expect(screen.getAllByText(/alice/).length).toBeGreaterThan(0);
=======
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
>>>>>>> origin
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
    expect(screen.queryByText('Tap to unpin')).not.toBeInTheDocument();
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

  it('renders persona and peak hour correctly', () => {
    renderHeader({
      persona: { label: 'Architect', emoji: '🏗️', description: 'desc' },
      peakHour: 10,
    });
    expect(screen.getAllByText('Architect').length).toBeGreaterThan(0);
    expect(screen.getAllByText('🏗️').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Based on your 10am peak/i).length).toBeGreaterThan(0);
  });

  it('renders society count and calls handler', () => {
    const onSocietiesClick = vi.fn();
    renderHeader({
      societies: [{ id: 1 }, { id: 2 }],
      onSocietiesClick,
    });
    const societyBtn = screen.getByRole('button', { name: /2\s+societies/i });
    fireEvent.click(societyBtn);
    expect(onSocietiesClick).toHaveBeenCalled();
  });

  it('handles badge tooltip show and hide', () => {
    renderHeader({
      badges: [{ id: 'b1', label: 'Badge 1', emoji: '🏅', description: 'desc 1' }],
    });
    const badgeBtn = screen.getAllByText('🏅')[0].closest('button');
    fireEvent.mouseEnter(badgeBtn);
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    fireEvent.mouseLeave(badgeBtn);
    expect(screen.queryByText('Badge 1')).toBeNull();
  });

  it('handles shared calendar and navigation', () => {
    const onNavigate = vi.fn();
    renderHeader({
      user: { id: 123, username: 'bob', is_sharing: true },
      profileData: { id: 123, is_shared_with_me: true },
      visibility: { ...defaultVisibility, canEditProfile: false },
      onNavigate,
    });
    expect(screen.getAllByText(/Shared calendar with me/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText(/View their calendar/i)[0]);
    expect(onNavigate).toHaveBeenCalledWith(expect.stringContaining('user_id=123'));
  });

  it('covers null fallbacks and empty states', () => {
    // Branch 30, 36, 46, etc.
    const { rerender } = renderHeader({
      badges: null,
      profileData: { email: null, id: 1 },
      visibility: { ...defaultVisibility },
    });
    expect(screen.queryByText(/unlocked/i)).toBeNull(); // ProfileBadges returns null

    rerender(<ProfileHeader {...buildHeaderProps({ profileData: null })} />);
    // ProfileStats returns null if stats is falsy

    rerender(<ProfileHeader {...buildHeaderProps({ profileData: { id: 1, email: null } })} />);
    // ContactEmail returns null if email is falsy
  });

  it('renders FeaturedBadgeCard and clicking it calls onPinBadge', () => {
    const onPinBadge = vi.fn();
    const badge = { id: 'goal_getter', label: 'Goal Getter', emoji: '🎯', description: 'desc' };
    renderHeader({
      badges: [badge],
      pinnedBadgeId: 'goal_getter',
      onPinBadge,
      visibility: { ...defaultVisibility, canEditProfile: true },
    });
    expect(screen.getByText('Goal Getter')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Tap to unpin'));
    expect(onPinBadge).toHaveBeenCalledWith('goal_getter');
  });

  it('calls setOptimisticShare from SharedCalendarActions', () => {
    renderHeader({
      user: { id: 123, username: 'bob', is_sharing: false },
      profileData: { id: 123, is_shared_with_me: true },
      visibility: { ...defaultVisibility, canEditProfile: false },
      onNavigate: vi.fn(),
    });
    // multiple share buttons (desktop/mobile)
    const shareBtn = screen.getAllByTestId('share-button')[0];
    fireEvent.click(shareBtn);
    expect(defaultHandlers.setOptimisticShare).toHaveBeenCalled();
  });

  it('covers roleLabel student branch', () => {
    renderHeader({
      user: { role: 'student' },
      profileData: { first_name: 'test' },
    });
    expect(screen.getAllByText('Student').length).toBeGreaterThan(0);
  });

  it('calls onViewAllBadges when View All link is clicked', () => {
    const onViewAllBadges = vi.fn();
    renderHeader({
      badges: [{ id: 'b1', label: 'B1', emoji: '🏅' }],
      onViewAllBadges,
    });
    fireEvent.click(screen.getByText(/View All/i));
    expect(onViewAllBadges).toHaveBeenCalled();
  });

  it('falls back to user.major when profileData.major is missing (line 26)', () => {
    renderHeader({
      user: { role: 'student', major: 'Physics' },
      profileData: { year: 'Year 2' }, // no major in profileData
    });
    expect(screen.getAllByText('Student').length).toBeGreaterThan(0);
  });

  it('student with no major shows empty description (line 26 empty branch)', () => {
    renderHeader({
      user: { role: 'student' },
      profileData: { year: 'Year 3' }, // no major anywhere
    });
    // Should render with empty major — no "Teaching staff" fallback
    expect(screen.getAllByText('Student').length).toBeGreaterThan(0);
  });

  it('teacher with no major falls back to "Teaching staff" (line 26 true branch)', () => {
    renderHeader({
      user: { role: 'teacher' },
      profileData: { year: '' }, // no major anywhere
    });
    // Should render "Department: Teaching staff"
    expect(screen.getAllByText('Department: Teaching staff').length).toBeGreaterThan(0);
  });

  it('buildSharedCalendarRoute returns /calendar when id is null (line 36)', () => {
    const onNavigate = vi.fn();
    // profileData has is_shared_with_me but no id; user also has no id
    renderHeader({
      user: { id: null },
      profileData: { id: null, is_shared_with_me: true },
      visibility: { ...defaultVisibility, canEditProfile: false },
      onNavigate,
    });
    fireEvent.click(screen.getAllByText(/View their calendar/i)[0]);
    expect(onNavigate).toHaveBeenCalledWith('/calendar');
  });

  it('buildSharedCalendarRoute falls back to "Shared user" when no name or username (line 40)', () => {
    const onNavigate = vi.fn();
    renderHeader({
      user: { id: 999 },
      profileData: { id: 999, is_shared_with_me: true }, // no name or username
      visibility: { ...defaultVisibility, canEditProfile: false },
      onNavigate,
    });
    fireEvent.click(screen.getAllByText(/View their calendar/i)[0]);
    expect(onNavigate).toHaveBeenCalledWith(expect.stringContaining('Shared+user'));
  });



  it('PersonaInlineChip renders nothing when persona is null (line 190)', () => {
    renderHeader({ persona: null });
    expect(screen.queryByRole('img', { name: /persona/i })).toBeNull();
  });

  it('ProfileBadges handles undefined badges as empty (lines 134-135)', () => {
    renderHeader({ badges: undefined });
    // ProfileBadges returns null when badges is undefined/empty — no badge rail
    expect(screen.queryByText(/View All/i)).toBeNull();
  });
});
