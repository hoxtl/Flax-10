/**
 * Profile feature modals.
 */
import { useEffect, useState } from "react";
import EditProfileModal from "../../components/Dashboard/EditProfileModal";
import GenericSummaryModal from "../../components/Common/GenericSummaryModal/GenericSummaryModal";
import SummaryItem from "../../components/Common/GenericSummaryModal/SummaryItem";
import { SegmentedControl } from "../../components/Common";
import UserListModal from "../../components/Social/UserListModal";
import { getModules } from "../../api/modules/moduleApi";
import { getSharedWithMe, getSharingWith } from "../../api/social/socialApi";
import { fetchTasks } from "../../api/tasks/taskApi";
import { DATE_FORMAT, getRangeLabel, RANGE_OPTIONS, TIME_FORMAT } from "./utils/profileHelpers";

function formatEventMeta(event) {
  const date = new Date(event.start_time);
  const dateStr = date.toLocaleDateString("en-GB", DATE_FORMAT);
  const timeStr = date.toLocaleTimeString("en-GB", TIME_FORMAT);
  return `${dateStr} at ${timeStr}${event.location ? ` • ${event.location}` : ""}`;
}

function EventsModal({ isOpen, onClose, events, range, onRangeChange }) {
  const options = RANGE_OPTIONS.map(([value, label]) => ({ value, label }));
  return <GenericSummaryModal isOpen={isOpen} onClose={onClose} title={`Events - ${getRangeLabel(range)} (${events.length})`} emptyMessage="No events found for this period" topContent={<SegmentedControl fill variant="solid" options={options} value={range} onChange={onRangeChange} />} items={events} renderItem={(event, index) => <SummaryItem key={index} avatar="📅" title={event.title} subtitle={formatEventMeta(event)} />} />;
}

function useModuleNameMap(isOpen) {
  const [nameMap, setNameMap] = useState({});
  useEffect(() => {
    if (!isOpen) return;
    getModules().then((data) => setNameMap(buildModuleNameMap(data))).catch(() => {});
  }, [isOpen]);
  return nameMap;
}

function buildModuleNameMap(data) {
  const list = Array.isArray(data) ? data : data?.results || [];
  const entries = list.filter((moduleItem) => moduleItem.module_code).map((moduleItem) => [moduleItem.module_code, moduleItem.module_name]);
  return Object.fromEntries(entries);
}

function ModulesModal({ isOpen, onClose, modules, onNavigate }) {
  const nameMap = useModuleNameMap(isOpen);
  return <GenericSummaryModal isOpen={isOpen} onClose={onClose} title="Modules" emptyMessage="No modules found" items={modules} renderItem={(code, index) => <SummaryItem key={index} avatar="📚" title={nameMap[code] ? `${code} – ${nameMap[code]}` : code} subtitle={null} onClick={() => { onClose?.(); onNavigate?.(`modules_${code}`); }} />} />;
}

function buildSocietyAvatar(society) {
  const imageUrl = society.cover_image || society.image;
  return imageUrl ? <img src={imageUrl} alt={society.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} /> : "🏛️";
}

export function SocietiesModal({ isOpen, onClose, societies, onNavigate }) {
  return <GenericSummaryModal isOpen={isOpen} onClose={onClose} title="Societies" emptyMessage="No societies found" items={societies || []} renderItem={(society, index) => <SummaryItem key={society.society_id ?? society.id ?? index} avatar={buildSocietyAvatar(society)} title={society.name} subtitle={society.description || null} onClick={() => navigateToSociety(society, onClose, onNavigate)} />} />;
}

function navigateToSociety(society, onClose, onNavigate) {
  const societyId = society.society_id ?? society.id;
  if (!societyId) return;
  onClose?.();
  onNavigate?.(`/societies?id=${societyId}`);
}

function formatTaskMeta(task) {
  const dueDate = task?.due_date ? new Date(task.due_date).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "No due date";
  const listName = task?.task_list_name || task?.list_name || task?.module_code || "Task";
  return `${dueDate} • ${listName}`;
}

function sortOpenTasks(data) {
  const list = Array.isArray(data) ? data : data?.results || [];
  return list.filter((task) => !task.completed).sort((left, right) => sortByDueDate(left.due_date, right.due_date));
}

function sortByDueDate(leftDate, rightDate) {
  if (!leftDate) return 1;
  if (!rightDate) return -1;
  return new Date(leftDate) - new Date(rightDate);
}

function useTasksModalData(isOpen) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isOpen) return resetTasks(setLoading, setTasks);
    setLoading(true);
    fetchTasks().then(sortOpenTasks).then(setTasks).catch(() => setTasks([])).finally(() => setLoading(false));
  }, [isOpen]);
  return { loading, tasks };
}

function resetTasks(setLoading, setTasks) {
  setTasks([]);
  setLoading(false);
}

function TasksModal({ isOpen, onClose }) {
  const { tasks, loading } = useTasksModalData(isOpen);
  return <GenericSummaryModal isOpen={isOpen} onClose={onClose} title={`Tasks${tasks.length ? ` (${tasks.length})` : ""}`} emptyMessage="No active tasks right now." loading={loading} items={tasks} renderItem={(task, index) => <SummaryItem key={task.id ?? index} avatar="✓" title={task.title} subtitle={formatTaskMeta(task)} />} />;
}

function useSocialUsers(isOpen, userId, fetchFn) {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    if (!(isOpen && userId)) return setUsers([]);
    fetchFn(userId)
      .then((data) => setUsers(data.results || data))
      .catch((error) => {
        console.error("Failed to fetch users", error);
        setUsers([]);
      });
  }, [fetchFn, isOpen, userId]);
  return users;
}

function buildSharedCalendarRoute(user) {
  if (!user?.id) return "/calendar";
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "Shared user";
  const params = new URLSearchParams({ user_id: String(user.id), shared_name: displayName });
  return `/calendar?${params.toString()}`;
}

function buildSharingTitle(mode, count) {
  if (mode === "sharing_with_me") {
    if (count === 1) return "1 person has shared their calendar events with me";
    if (count > 1) return `${count} people have shared their calendar events with me`;
    return "People who have shared their calendar events with me";
  }
  if (count === 1) return "1 person can see my calendar events";
  if (count > 1) return `${count} people can see my calendar events`;
  return "People who can see my calendar events";
}

function SocialDataModal({
  isOpen,
  onClose,
  titleMode,
  fetchFn,
  userId,
  onNavChange,
  onUserUpdate,
  emptyHint,
  showCalendarAction = false,
}) {
  const users = useSocialUsers(isOpen, userId, fetchFn);
  if (!isOpen) return null;
  const handleUserOpen = (user) => {
    onClose();
    onNavChange?.(`profile_${user.id}`);
  };
  const handleCalendarOpen = (user) => {
    onClose();
    onNavChange?.(buildSharedCalendarRoute(user));
  };
  return (
    <UserListModal
      title={buildSharingTitle(titleMode, users.length)}
      users={users}
      emptyHint={emptyHint}
      showCalendarAction={showCalendarAction}
      onClose={onClose}
      onUserClick={handleUserOpen}
      onUserCalendarClick={showCalendarAction ? handleCalendarOpen : undefined}
      onUserUpdate={onUserUpdate}
    />
  );
}

function EditProfileSection({ state }) {
  return <EditProfileModal user={state.profileData} isOpen={state.showEditProfile} onClose={() => state.setShowEditProfile(false)} onSave={state.handleSaveProfile} />;
}

function SharingModals({ user, state, onNavChange }) {
  const userId = (state.profileData || user)?.id;
  return (
    <>
      <SocialDataModal
        isOpen={state.showSharedWith}
        onClose={() => state.setShowSharedWith(false)}
        titleMode="shared_with"
        fetchFn={getSharingWith}
        userId={userId}
        onNavChange={onNavChange}
        onUserUpdate={state.reload}
        emptyHint="No one can see your calendar events yet."
      />
      <SocialDataModal
        isOpen={state.showSharedBy}
        onClose={() => state.setShowSharedBy(false)}
        titleMode="sharing_with_me"
        fetchFn={getSharedWithMe}
        userId={userId}
        onNavChange={onNavChange}
        onUserUpdate={state.reload}
        emptyHint="No one has shared their calendar events with you yet."
        showCalendarAction
      />
    </>
  );
}

function ProfileEditModals({ user, state, modules, visibility, onNavChange }) {
  return (
    <>
      {visibility.canEditProfile && <EditProfileSection state={state} />}
      {visibility.canViewModules && <ModulesModal isOpen={state.showModules} onClose={() => state.setShowModules(false)} modules={modules} onNavigate={onNavChange} />}
      {visibility.canViewTasks && <TasksModal isOpen={state.showTasks} onClose={() => state.setShowTasks(false)} />}
      {visibility.canViewSharedWith && <SharingModals user={user} state={state} onNavChange={onNavChange} />}
    </>
  );
}

function EventsModalContainer({ state, filteredEvents, visibility }) {
  if (!visibility.canViewEvents) return null;
  return <EventsModal isOpen={state.showEvents} onClose={() => state.setShowEvents(false)} events={filteredEvents} range={state.eventRange} onRangeChange={state.setEventRange} />;
}

export default function ProfileModals({ user, state, modules, filteredEvents, visibility, onNavChange }) {
  return (
    <>
      <ProfileEditModals user={user} state={state} modules={modules} visibility={visibility} onNavChange={onNavChange} />
      <EventsModalContainer state={state} filteredEvents={filteredEvents} visibility={visibility} />
    </>
  );
}
