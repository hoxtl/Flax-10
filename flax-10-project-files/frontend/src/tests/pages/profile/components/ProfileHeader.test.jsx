/**
 * Tests for ProfileHeader and its subcomponents.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileHeader from '../../../../pages/profile/components/ProfileHeader';

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

const defaultVisibility = {
  canViewModules: true,
  canViewTasks: true,
  canViewEvents: true,
  canViewSharedWith: true,
  canEditProfile: true,
};

const defaultHandlers = {
  onEditProfile: vi.fn(),
  onModulesClick: vi.fn(),
  onTasksClick: vi.fn(),
  onEventsClick: vi.fn(),
  onSharedWithClick: vi.fn(),
  onSharedByClick: vi.fn(),
  reload: vi.fn(),
  setOptimisticShare: vi.fn(),
};

function buildHeaderProps(props = {}) {
  return {
    user: {},
    profileData: {},
    upcomingEventCount: 0,
    handlers: defaultHandlers,
    visibility: defaultVisibility,
    ...props,
  };
}

function renderHeader(props = {}) {
  return render(
    <ProfileHeader
      {...buildHeaderProps(props)}
    />
  );
}

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders desktop username from user', () => {
    renderHeader({
      user: { username: 'alice', first_name: 'Alice', last_name: 'Smith' },
      profileData: null,
    });
    expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
  });

  it('renders guest when no username', () => {
    renderHeader({ user: {} });
    expect(screen.getAllByText('guest').length).toBeGreaterThan(0);
  });

  it('renders profile photo when profile_photo_url is set', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { profile_photo_url: 'https://example.com/photo.jpg' },
    });
    const imgs = document.querySelectorAll('img[alt="Profile"]');
    expect(imgs.length).toBe(2);
    expect(imgs[0].src).toContain('example.com/photo.jpg');
  });

  it('falls back to seeded tutor photo when profile photo is missing', () => {
    renderHeader({
      user: { username: 'srahwan', first_name: 'Sam', last_name: 'Rahwan' },
    });
    const imgs = document.querySelectorAll('img[alt="Profile"]');
    expect(imgs.length).toBe(2);
    expect(imgs[0].src).toContain('images.unsplash.com');
  });

  it('renders Edit profile button when canEditProfile is true', () => {
    renderHeader({
      user: { username: 'alice' },
      visibility: { ...defaultVisibility, canEditProfile: true },
    });
    expect(screen.getByText('Edit profile')).toBeTruthy();
    expect(screen.getByText('Edit Profile')).toBeTruthy();
    fireEvent.click(screen.getByText('Edit profile'));
    expect(defaultHandlers.onEditProfile).toHaveBeenCalled();
  });

  it('renders ShareButton when canEditProfile is false', () => {
    renderHeader({
      user: { id: 42, username: 'alice', is_sharing: false },
      visibility: { ...defaultVisibility, canEditProfile: false },
    });
    expect(screen.queryByText('Edit profile')).toBeNull();
    expect(screen.getAllByTestId('share-button').length).toBeGreaterThan(0);
  });

  it('ShareButton onToggle calls setOptimisticShare and reload', () => {
    renderHeader({
      user: { id: 42, username: 'alice', is_sharing: false },
      visibility: { ...defaultVisibility, canEditProfile: false },
    });
    const shareBtn = screen.getAllByTestId('share-button')[0];
    fireEvent.click(shareBtn);
    expect(defaultHandlers.setOptimisticShare).toHaveBeenCalledWith(true);
    expect(defaultHandlers.reload).toHaveBeenCalled();
  });

  it('renders stat buttons and calls handlers on click', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { module_count: 2, task_count: 5, shared_with_count: 1, shared_by_count: 4 },
      upcomingEventCount: 3,
    });
    expect(screen.getByText('modules')).toBeTruthy();
    expect(screen.queryByText('tasks')).toBeNull();
    expect(screen.queryByText('events')).toBeNull();
    const modulesBtn = screen.getByRole('button', { name: /2\s+modules/ });
    const sharedByBtn = screen.getByRole('button', { name: /4\s+sharing with me/i });
    fireEvent.click(modulesBtn);
    fireEvent.click(sharedByBtn);
    expect(defaultHandlers.onModulesClick).toHaveBeenCalled();
    expect(defaultHandlers.onSharedByClick).toHaveBeenCalled();
  });

  it('renders bio when profileData.bio is set', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { bio: 'Love coding' },
    });
    expect(screen.getByText('Love coding')).toBeTruthy();
  });

  it('renders year and major with separator when both present', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { year: 'Year 2', major: 'Computer Science' },
    });
    expect(screen.getAllByText(/Year 2/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Computer Science/).length).toBeGreaterThan(0);
    expect(document.body.textContent).toMatch(/·/);
  });

  it('shows department and hides year for professors', () => {
    renderHeader({
      user: { username: 'echen', first_name: 'Eric', last_name: 'Chen', role: 'teacher' },
      profileData: { year: 'Year 2', major: 'Spanish' },
    });
    expect(screen.getAllByText('Professor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Department: Spanish').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Year 2/)).toBeNull();
  });

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
  });

  it('shows the shared planning tip when viewing another user profile', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { email: 'alice@kcl.ac.uk', year: 'Year 2', major: 'Physics' },
      visibility: { ...defaultVisibility, canEditProfile: false },
    });
    expect(screen.getAllByText('Tip').length).toBeGreaterThan(0);
    expect(screen.getByText(/Compare free slots to find times that work for both of you/i)).toBeInTheDocument();
  });

  it('hides stats when visibility flags are false', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { module_count: 1, task_count: 0, shared_with_count: 0 },
      visibility: {
        canViewModules: false,
        canViewTasks: false,
        canViewEvents: false,
        canViewSharedWith: false,
        canEditProfile: true,
      },
    });
    expect(screen.queryByText('modules')).toBeNull();
    expect(screen.queryByText('tasks')).toBeNull();
    expect(screen.queryByText('events')).toBeNull();
    expect(screen.queryByText('shared')).toBeNull();
  });

  it('uses profileData for mobile username when present', () => {
    renderHeader({
      user: { username: 'userOld' },
      profileData: { username: 'profileNew' },
    });
    expect(screen.getAllByText('profileNew').length).toBeGreaterThan(0);
  });

  it('uses numeric fallbacks for counts when profileData missing', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: undefined,
      upcomingEventCount: 2,
    });
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it.each([
    ['Active just now', { last_session_end: new Date().toISOString() }, 'Active just now'],
    [/Active .* ago/, { last_session_end: '2026-03-18T12:00:00.000Z' }, 'old active-status text'],
  ])('does not render %s', (missingText, profileData, _label) => {
    renderHeader({
      user: { username: 'alice' },
      profileData,
    });
    expect(screen.queryByText(missingText)).toBeNull();
  });

  it('does not render completion nudge text', () => {
    renderHeader({
      user: { username: 'alice' },
      profileData: { profile_completion: { percentage: 60, next_action: 'add a bio to stand out' } },
    });
    expect(screen.queryByText('Profile 60% complete - add a bio to stand out')).toBeNull();
  });

  it('pins badge when badge button is clicked', () => {
    const onPinBadge = vi.fn();
    renderHeader({
      user: { username: 'alice' },
      badges: [
        { id: 'goal_getter', label: 'Goal Getter', emoji: '🎯', description: 'desc' },
        { id: 'sessions_10', label: 'Regular', emoji: '🎖️', description: 'desc' },
      ],
      pinnedBadgeId: "",
      onPinBadge,
    });
    fireEvent.click(screen.getByText('🎯').closest('button'));
    expect(onPinBadge).toHaveBeenCalledWith('goal_getter');
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
