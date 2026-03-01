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
vi.mock('../../components/Timer/MiniTimer', () => ({ default: () => null }));
vi.mock('../../components/Notifications/NotificationPanel', () => ({ NotificationPanel: () => null }));
vi.mock('../../context/NotificationContext', () => ({
  useNotifications: () => ({ togglePanel: vi.fn(), notifications: [] }),
}));

describe('TopBar', () => {
  it('renders static branding', () => {
    render(<TopBar user={{ first_name: 'Kausar' }} />);
    expect(screen.getByText('StudyFlax')).toBeTruthy();
    expect(screen.getByText('Built for calm study')).toBeTruthy();
  });

  it('renders without user prop', () => {
    render(<TopBar />);
    expect(screen.getByText('StudyFlax')).toBeTruthy();
  });

  it('renders regardless of user object shape', () => {
    render(<TopBar user={{ username: 'kausar' }} />);
    expect(screen.getByText('StudyFlax')).toBeTruthy();
  });

  it('calls onAddClick when add tab selected', () => {
    const onAdd = vi.fn();
    render(<TopBar onAddClick={onAdd} />);
    fireEvent.click(screen.getByText('add-tab'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('does not call onAddClick for non-0 tab index', () => {
    const onAdd = vi.fn();
    render(<TopBar onAddClick={onAdd} />);
    fireEvent.click(screen.getByText('notif-tab'));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('handles null tab index without crash', () => {
    expect(() => {
      render(<TopBar onAddClick={vi.fn()} />);
      fireEvent.click(screen.getByText('deselect'));
    }).not.toThrow();
  });

  it('calls onSettingsClick', () => {
    const fn = vi.fn();
    render(<TopBar onSettingsClick={fn} />);
    fireEvent.click(screen.getByText('settings'));
    expect(fn).toHaveBeenCalled();
  });

  it('renders search input', () => {
    render(<TopBar />);
    expect(screen.getByPlaceholderText('Search…')).toBeTruthy();
  });
});