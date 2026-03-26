import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileModals from '../../../pages/profile/ProfileModals';
import { getModules } from '../../../api/moduleApi';
import { createFnMap } from '../../utils/testBuilderUtils';
vi.mock('../../../components/dashboard/EditProfileModal', () => ({ default: ({ isOpen, onClose }) => isOpen ? <div data-testid="edit-profile-modal"><button onClick={onClose}>Close Edit</button></div> : null }));
vi.mock('../../../components/social/UserListModal', () => ({ default: () => <div data-testid="user-list-modal" /> }));
vi.mock('../../../api/socialApi', () => ({ getSharingWith: vi.fn(), getSharedWithMe: vi.fn() }));
vi.mock('../../../api/moduleApi', () => ({ getModules: vi.fn().mockResolvedValue([]) }));
vi.mock('../../../api/taskApi', () => ({ fetchTasks: vi.fn().mockResolvedValue([]) }));
vi.mock('../../../pages/profile/hooks/useProfileModalsData', async () => ({ ...(await vi.importActual('../../../pages/profile/hooks/useProfileModalsData')), useTasksModalData: vi.fn(() => ({ loading: false, tasks: [] })) }));
import { useTasksModalData } from '../../../pages/profile/hooks/useProfileModalsData';
const modalStateDefaults = { showEditProfile: false, profileData: { id: 1 }, showModules: false, showTasks: false, showSharedWith: false, showSharedBy: false, showEvents: false, eventRange: 'week' };
const makeState = (o = {}) => ({ ...modalStateDefaults, ...createFnMap(['setShowEditProfile', 'handleSaveProfile', 'setShowModules', 'setShowTasks', 'setShowSharedWith', 'setShowSharedBy', 'setShowEvents', 'setEventRange', 'reload']), ...o });
const dU = { id: 1, username: 'alice' };
const dM = ['CS101', 'MA202'];
const dE = [{ title: 'Meeting', start_time: '2024-03-08T10:00:00Z' }];
const dV = { canEditProfile: true, canViewModules: true, canViewTasks: true, canViewSharedWith: true, canViewEvents: true };
const renderModals = (s = {}) => render(<ProfileModals user={dU} state={makeState(s)} modules={dM} filteredEvents={dE} visibility={dV} onNavChange={vi.fn()}/>);
describe('ProfileModals Core', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('renders nothing when closed', () => {
    const { container } = renderModals();
    expect(screen.queryByTestId('edit-profile-modal')).toBeNull();
    expect(container.textContent).toBe('');
  });
  it('renders edit profile modal', () => {
    renderModals({ showEditProfile: true });
    expect(screen.getByTestId('edit-profile-modal')).toBeTruthy();
  });
  it('renders modules modal', () => {
    renderModals({ showModules: true });
    expect(screen.getByText('Modules')).toBeTruthy();
    expect(screen.getByText('CS101')).toBeTruthy();
  });
  it('renders mapped module names', async () => {
    vi.mocked(getModules).mockResolvedValueOnce({ results: [{ module_code: 'CS101', module_name: 'Intro' }] });
    renderModals({ showModules: true, modules: ['CS101'] });
    await waitFor(() => expect(screen.getByText('CS101 – Intro')).toBeTruthy());
  });
  it('renders tasks modal', async () => {
    renderModals({ showTasks: true });
    expect(screen.getByText('Tasks')).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/No active tasks/i)).toBeTruthy());
  });
  it('renders task count', async () => {
    useTasksModalData.mockReturnValueOnce({ loading: false, tasks: [{ id: 1, title: 'Read', completed: false, task_list_name: 'W1', due_date: null }] });
    renderModals({ showTasks: true });
    await waitFor(() => expect(screen.getByText('Tasks (1)')).toBeTruthy());
  });
  it('renders events modal', () => {
    renderModals({ showEvents: true });
    expect(screen.getByText(/Events/)).toBeTruthy();
    expect(screen.getByText('Meeting')).toBeTruthy();
  });
  it('calls setEventRange', () => {
    const setEventRange = vi.fn();
    renderModals({ showEvents: true, setEventRange });
    fireEvent.click(screen.getByText('Today'));
    expect(setEventRange).toHaveBeenCalledWith('today');
  });
  it('closes events modal', () => {
    const setShowEvents = vi.fn();
    renderModals({ showEvents: true, setShowEvents });
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(setShowEvents).toHaveBeenCalledWith(false);
  });
  it('modules modal click navigates', () => {
    const onNavChange = vi.fn(), setShowModules = vi.fn();
    renderModals({ showModules: true, setShowModules }, onNavChange);
    fireEvent.click(screen.getByText('CS101'));
    expect(setShowModules).toHaveBeenCalledWith(false);
  });
});
