import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopBar from '../../components/Dashboard/Topbar';

vi.mock('../../components/Dashboard/ProfileDropdown', () => ({
  default: ({ onSettingsClick, onLogoutClick, onProfileClick }) => (
    <div>
      <button onClick={onSettingsClick}>settings</button>
      <button onClick={onLogoutClick}>logout</button>
      <button onClick={onProfileClick}>profile</button>
    </div>
  ),
}));

vi.mock('../../components/Dashboard/ExpandableTabs', () => ({
  ExpandableTabs: ({ onChange }) => (
    <div>
      <button onClick={() => onChange(0)}>add-tab</button>
      <button onClick={() => onChange(1)}>notif-tab</button>
      <button onClick={() => onChange(null)}>deselect</button>
    </div>
  ),
}));

vi.mock('../../components/Dashboard/ThemeToggle', () => ({ default: () => <button>theme</button> }));
vi.mock('../../components/Timer/MiniTimer', () => ({ default: () => <div>timer</div> }));
vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ togglePanel: vi.fn(), notifications: [] })
}));
vi.mock('../../components/Notifications/NotificationPanel', () => ({
  NotificationPanel: () => <div>notifications</div>
}));

describe('TopBar', () => {
  it('renders greeting', () => {
    render(<TopBar user={{ name: 'Kausar' }} />);
    expect(screen.getByText('StudyFlax')).toBeTruthy();
    expect(screen.getByText('Built for calm study')).toBeTruthy();
  });

  it('renders without user', () => {
    const { container } = render(<TopBar />);
    expect(screen.getByText('StudyFlax')).toBeTruthy();
  });

  it('calls onSettingsClick', () => {
    const fn = vi.fn();
    render(<TopBar user={{}} onSettingsClick={fn} />);
    fireEvent.click(screen.getByText('settings'));
    expect(fn).toHaveBeenCalled();
  });

  it('renders search input', () => {
    render(<TopBar />);
    expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
  });
});