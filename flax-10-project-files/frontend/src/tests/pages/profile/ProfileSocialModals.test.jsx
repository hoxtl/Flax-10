import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileModals from '../../../pages/profile/ProfileModals';
import { createFnMap } from '../../utils/testBuilderUtils';
vi.mock('../../../components/social/UserListModal', () => ({
  default: ({ title, users, onClose, onUserClick, onUserCalendarClick, showCalendarAction }) => (
    <div data-testid="user-list-modal"><span>{title}</span><button onClick={onClose}>Close List</button>{(users || []).map((u, i) => (
      <div key={i}><div onClick={() => onUserClick?.(u)}>{u.username}</div>{showCalendarAction && <button onClick={() => onUserCalendarClick?.(u)}>View calendar</button>}</div>
    ))}</div>
  ),
}));
vi.mock('../../../api/socialApi', () => ({ getSharingWith: vi.fn().mockResolvedValue([]), getSharedWithMe: vi.fn().mockResolvedValue([]) }));
vi.mock('../../../api/moduleApi', () => ({ getModules: vi.fn().mockResolvedValue([]) }));
vi.mock('../../../api/taskApi', () => ({ fetchTasks: vi.fn().mockResolvedValue([]) }));
vi.mock('../../../pages/profile/hooks/useProfileModalsData', async () => ({ ...(await vi.importActual('../../../pages/profile/hooks/useProfileModalsData')), useTasksModalData: vi.fn(() => ({ loading: false, tasks: [] })) }));
const modalStateDefaults = { showEditProfile: false, profileData: { id: 1 }, showModules: false, showTasks: false, showSharedWith: false, showSharedBy: false, showEvents: false, eventRange: 'week' };
const makeState = (o = {}) => ({ ...modalStateDefaults, ...createFnMap(['setShowEditProfile', 'handleSaveProfile', 'setShowModules', 'setShowTasks', 'setShowSharedWith', 'setShowSharedBy', 'setShowEvents', 'setEventRange', 'reload']), ...o });
const dU = { id: 1, username: 'alice' };
const dM = ['CS101'];
const dE = [{ title: 'M', start_time: '2024-03-08T10:00:00Z' }];
const dV = { canEditProfile: true, canViewModules: true, canViewTasks: true, canViewSharedWith: true, canViewEvents: true };
const renderModals = (s = {}, oN = vi.fn()) => render(<ProfileModals user={dU} state={makeState(s)} modules={dM} filteredEvents={dE} visibility={dV} onNavChange={oN} />);
describe('Profile Social Modals', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders sharing modal when showSharedWith is true', async () => {
    const { getSharingWith } = await import('../../../api/socialApi');
    getSharingWith.mockResolvedValue([{ id: 2, username: 'bob' }]);
    renderModals({ showSharedWith: true });
    await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
  });
  it('renders Shared By modal when showSharedBy true', async () => {
    const { getSharedWithMe } = await import('../../../api/socialApi');
    getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol' }]);
    renderModals({ showSharedBy: true });
    await waitFor(() => expect(screen.getByTestId('user-list-modal')).toBeTruthy());
  });
  it('renders zero-count titles for empty lists', async () => {
    renderModals({ showSharedWith: true });
    await waitFor(() => expect(screen.getByText('People who can see my calendar events')).toBeTruthy());
    renderModals({ showSharedBy: true });
    await waitFor(() => expect(screen.getByText('People who have shared their calendar events with me')).toBeTruthy());
  });
  it('opens shared calendar from Shared By modal', async () => {
    const oN = vi.fn(), sS = vi.fn();
    const { getSharedWithMe } = await import('../../../api/socialApi');
    getSharedWithMe.mockResolvedValue([{ id: 3, username: 'carol', first_name: 'C', last_name: 'S' }]);
    renderModals({ showSharedBy: true, setShowSharedBy: sS }, oN);
    fireEvent.click(await screen.findByRole('button', { name: /view calendar/i }));
    expect(sS).toHaveBeenCalledWith(false);
    expect(oN).toHaveBeenCalledWith('/calendar?user_id=3&shared_name=C+S');
  });
  it('uses username when shared calendar owner has no names', async () => {
    const oN = vi.fn();
    const { getSharedWithMe } = await import('../../../api/socialApi');
    getSharedWithMe.mockResolvedValue([{ id: 3, username: 'anon' }]);
    renderModals({ showSharedBy: true }, oN);
    fireEvent.click(await screen.findByRole('button', { name: /view calendar/i }));
    expect(oN).toHaveBeenCalledWith('/calendar?user_id=3&shared_name=anon');
  });
  it('falls back to plain calendar route when shared user has no id', async () => {
    const oN = vi.fn();
    const { getSharedWithMe } = await import('../../../api/socialApi');
    getSharedWithMe.mockResolvedValue([{ username: 'anon' }]);
    renderModals({ showSharedBy: true }, oN);
    fireEvent.click(await screen.findByRole('button', { name: /view calendar/i }));
    expect(oN).toHaveBeenCalledWith('/calendar');
  });
});
