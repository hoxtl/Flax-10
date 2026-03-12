/**
 * Tests for ProfileHeader and its subcomponents.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileHeader from '../../../../pages/Profile/components/ProfileHeader';

vi.mock('../../../../pages/Profile/utils/profileHelpers', () => ({
  buildInitials: vi.fn((user) => {
    if (user?.name) return 'AB';
    if (user?.first_name && user?.last_name) return `${user.first_name[0]}${user.last_name[0]}`;
    return '?';
  }),
  buildFullName: vi.fn((user) => {
    return user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Guest';
  }),
}));

vi.mock('../../../../components/Social/ShareButton', () => ({
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
  reload: vi.fn(),
  setOptimisticShare: vi.fn(),
};

describe('ProfileHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders desktop username from user', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice', first_name: 'Alice', last_name: 'Smith' }}
        profileData={null}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
  });

  it('renders guest when no username', () => {
    render(
      <ProfileHeader
        user={{}}
        profileData={{}}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    expect(screen.getAllByText('guest').length).toBeGreaterThan(0);
  });

  it('renders profile photo when profile_photo_url is set', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ profile_photo_url: 'https://example.com/photo.jpg' }}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    const imgs = document.querySelectorAll('img[alt="Profile"]');
    expect(imgs.length).toBe(2);
    expect(imgs[0].src).toContain('example.com/photo.jpg');
  });

  it('renders Edit profile button when canEditProfile is true', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{}}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={{ ...defaultVisibility, canEditProfile: true }}
      />
    );
    expect(screen.getByText('Edit profile')).toBeTruthy();
    expect(screen.getByText('Edit Profile')).toBeTruthy();
    fireEvent.click(screen.getByText('Edit profile'));
    expect(defaultHandlers.onEditProfile).toHaveBeenCalled();
  });

  it('renders ShareButton when canEditProfile is false', () => {
    render(
      <ProfileHeader
        user={{ id: 42, username: 'alice', is_sharing: false }}
        profileData={{}}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={{ ...defaultVisibility, canEditProfile: false }}
      />
    );
    expect(screen.queryByText('Edit profile')).toBeNull();
    expect(screen.getAllByTestId('share-button').length).toBeGreaterThan(0);
  });

  it('ShareButton onToggle calls setOptimisticShare and reload', () => {
    render(
      <ProfileHeader
        user={{ id: 42, username: 'alice', is_sharing: false }}
        profileData={{}}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={{ ...defaultVisibility, canEditProfile: false }}
      />
    );
    const shareBtn = screen.getAllByTestId('share-button')[0];
    fireEvent.click(shareBtn);
    expect(defaultHandlers.setOptimisticShare).toHaveBeenCalledWith(true);
    expect(defaultHandlers.reload).toHaveBeenCalled();
  });

  it('renders stat buttons and calls handlers on click', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 2, task_count: 5, shared_with_count: 1 }}
        upcomingEventCount={3}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    expect(screen.getByText('modules')).toBeTruthy();
    expect(screen.getByText('tasks')).toBeTruthy();
    expect(screen.getByText('events')).toBeTruthy();
    expect(screen.getByText('shared')).toBeTruthy();
    const modulesBtn = screen.getByRole('button', { name: /2\s+modules/ });
    fireEvent.click(modulesBtn);
    expect(defaultHandlers.onModulesClick).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /5\s+tasks/ }));
    expect(defaultHandlers.onTasksClick).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /3\s+events/ }));
    expect(defaultHandlers.onEventsClick).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /1\s+shared/ }));
    expect(defaultHandlers.onSharedWithClick).toHaveBeenCalled();
  });

  it('renders bio when profileData.bio is set', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ bio: 'Love coding' }}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    expect(screen.getByText('Love coding')).toBeTruthy();
  });

  it('renders year and major with separator when both present', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ year: 'Year 2', major: 'Computer Science' }}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    expect(screen.getAllByText(/Year 2/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Computer Science/).length).toBeGreaterThan(0);
    expect(document.body.textContent).toMatch(/·/);
  });

  it('hides stats when visibility flags are false', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={{ module_count: 1, task_count: 0, shared_with_count: 0 }}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={{
          canViewModules: false,
          canViewTasks: false,
          canViewEvents: false,
          canViewSharedWith: false,
          canEditProfile: true,
        }}
      />
    );
    expect(screen.queryByText('modules')).toBeNull();
    expect(screen.queryByText('tasks')).toBeNull();
    expect(screen.queryByText('events')).toBeNull();
    expect(screen.queryByText('shared')).toBeNull();
  });

  it('uses profileData for mobile username when present', () => {
    render(
      <ProfileHeader
        user={{ username: 'userOld' }}
        profileData={{ username: 'profileNew' }}
        upcomingEventCount={0}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    expect(screen.getAllByText('profileNew').length).toBeGreaterThan(0);
  });

  it('uses numeric fallbacks for counts when profileData missing', () => {
    render(
      <ProfileHeader
        user={{ username: 'alice' }}
        profileData={undefined}
        upcomingEventCount={2}
        handlers={defaultHandlers}
        visibility={defaultVisibility}
      />
    );
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });
});
