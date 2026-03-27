import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
<<<<<<< HEAD
import TopBar from '../../components/dashboard/components/Topbar';

vi.mock('../../components/dashboard/components/ProfileDropdown', () => ({
=======
import TopBar from '../../components/dashboard/Topbar';

vi.mock('../../components/dashboard/ProfileDropdown', () => ({
>>>>>>> main
  default: ({ onSettingsClick, onLogoutClick, onProfileClick }) => (
    <div>
      <button onClick={onSettingsClick}>settings</button>
      <button onClick={onLogoutClick}>logout</button>
      <button onClick={onProfileClick}>profile</button>
    </div>
  ),
}));

<<<<<<< HEAD
vi.mock('../../components/dashboard/components/ExpandableTabs', () => ({
=======
vi.mock('../../components/dashboard/ExpandableTabs', () => ({
>>>>>>> main
  ExpandableTabs: ({ tabs = [], onChange }) => (
    <div>
      <button data-testid={`tab-${tabs[0]?.title || 'unknown'}`} onClick={() => onChange(0)}>
        {tabs[0]?.title || 'tab'}
      </button>
      <button onClick={() => onChange(null)}>deselect</button>
    </div>
  ),
}));

<<<<<<< HEAD
vi.mock('../../components/dashboard/components/ThemeToggle', () => ({ default: () => <button>theme</button> }));
vi.mock('../../components/timer/components/MiniTimer', () => ({ default: () => <div>timer</div> }));
vi.mock('../../context/NotificationContext', () => ({
  useNotifications: vi.fn(() => ({ togglePanel: vi.fn(), notifications: [] })),
}));
vi.mock('../../components/notifications/components/NotificationPanel', () => ({
=======
vi.mock('../../components/dashboard/ThemeToggle', () => ({ default: () => <button>theme</button> }));
vi.mock('../../components/timer/MiniTimer', () => ({ default: () => <div>timer</div> }));
vi.mock('../../context/NotificationContext', () => ({
  useNotifications: vi.fn(() => ({ togglePanel: vi.fn(), notifications: [] })),
}));
vi.mock('../../components/notifications/NotificationPanel', () => ({
>>>>>>> main
  NotificationPanel: () => <div>notifications</div>
}));

describe('TopBar', () => {
  it('renders brand', () => {
    render(<TopBar user={{ first_name: 'Jane', username: 'JD' }} />);
    expect(screen.getByText('StudyFlax')).toBeTruthy();
  });

  it('renders the updated top-level nav groups', () => {
    render(<TopBar />);
    expect(screen.getByText('Plan')).toBeTruthy();
    expect(screen.getByText('Study')).toBeTruthy();
    expect(screen.getByText('Explore')).toBeTruthy();
    expect(screen.getByText('My Insights')).toBeTruthy();
  });

  it('renders without user', () => {
    render(<TopBar />);
    expect(screen.getByText('StudyFlax')).toBeTruthy();
  });

  it('calls onSettingsClick', () => {
    const fn = vi.fn();
    render(<TopBar user={{}} onSettingsClick={fn} />);
    fireEvent.click(screen.getByText('settings'));
    expect(fn).toHaveBeenCalled();
  });

  it('renders theme toggle and timer', () => {
    render(<TopBar />);
    expect(screen.getByText('theme')).toBeTruthy();
    expect(screen.getByText('timer')).toBeTruthy();
  });

  it('calls onNavChange with home when brand is clicked', () => {
    const onNavChange = vi.fn();
    render(<TopBar onNavChange={onNavChange} />);
    fireEvent.click(screen.getByText('StudyFlax'));
    expect(onNavChange).toHaveBeenCalledWith('home');
  });

  it('calls togglePanel when notifications tab is clicked', async () => {
    const togglePanel = vi.fn();
    const { useNotifications } = await import('../../context/NotificationContext');
    useNotifications.mockReturnValue({ togglePanel, notifications: [] });
    render(<TopBar />);
    fireEvent.click(screen.getByTestId('tab-Notifications'));
    expect(togglePanel).toHaveBeenCalled();
  });

  it('renders tools and timer', () => {
    const onNavChange = vi.fn();
    render(<TopBar onNavChange={onNavChange} activeNav="home" />);
    expect(screen.getByText('timer')).toBeTruthy();
  });
});
