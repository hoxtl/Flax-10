/**
 * Profile feature modals.
 */

import EditProfileModal from "../../components/dashboard/EditProfileModal";
import GenericSummaryModal from "../../components/common/generic_summary_modal/GenericSummaryModal";
import SummaryItem from "../../components/common/generic_summary_modal/SummaryItem";
import { SegmentedControl } from "../../components/common";
import UserListModal from "../../components/social/UserListModal";
import { DATE_FORMAT, getRangeLabel, RANGE_OPTIONS, TIME_FORMAT } from "./utils/profileHelpers";
import { socialDataFetchers, useModuleNameMap, useSocialUsers, useTasksModalData } from "./hooks/useProfileModalsData";

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

function ModulesModal({ isOpen, onClose, modules, onNavigate }) {
  const nameMap = useModuleNameMap(isOpen);
  return <GenericSummaryModal isOpen={isOpen} onClose={onClose} title="Modules" emptyMessage="No modules found" items={modules} renderItem={(code, index) => <SummaryItem key={index} avatar="📚" title={nameMap[code] ? `${code} – ${nameMap[code]}` : code} subtitle={null} onClick={() => { onClose?.(); onNavigate?.(`modules_${code}`); }} />} />;
}

const SOCIETY_AVATAR_STYLE = { width: 28, height: 28, borderRadius: "50%", objectFit: "cover" };

function buildSocietyAvatar(society) {
  const imageUrl = society.cover_image || society.image;
  return imageUrl ? <img src={imageUrl} alt={society.name} style={SOCIETY_AVATAR_STYLE} /> : "🏛️";
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

function TasksModal({ isOpen, onClose }) {
  const { tasks, loading } = useTasksModalData(isOpen);
  return <GenericSummaryModal isOpen={isOpen} onClose={onClose} title={`Tasks${tasks.length ? ` (${tasks.length})` : ""}`} emptyMessage="No active tasks right now." loading={loading} items={tasks} renderItem={(task, index) => <SummaryItem key={task.id ?? index} avatar="✓" title={task.title} subtitle={formatTaskMeta(task)} />} />;
}

function buildSharedCalendarRoute(user) {
  if (!user?.id) return "/calendar";
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "Shared user";
  const params = new URLSearchParams({ user_id: String(user.id), shared_name: displayName });
  return `/calendar?${params.toString()}`;
}

const SHARING_TITLES = {
  sharing_with_me: (n) => n === 1 ? "1 person has shared their calendar events with me" : n > 1 ? `${n} people have shared their calendar events with me` : "People who have shared their calendar events with me",
  shared_with: (n) => n === 1 ? "1 person can see my calendar events" : n > 1 ? `${n} people can see my calendar events` : "People who can see my calendar events",
};

function buildSharingTitle(mode, count) {
  return (SHARING_TITLES[mode] || SHARING_TITLES.shared_with)(count);
}

function buildUserOpenHandler(onClose, onNavChange) {
  return (user) => { onClose(); onNavChange?.(`profile_${user.id}`); };
}

function buildCalendarOpenHandler(onClose, onNavChange) {
  return (user) => { onClose(); onNavChange?.(buildSharedCalendarRoute(user)); };
}

function SocialDataModal({ isOpen, onClose, titleMode, fetchFn, userId, onNavChange, onUserUpdate, emptyHint, showCalendarAction = false }) {
  const users = useSocialUsers(isOpen, userId, fetchFn);
  if (!isOpen) return null;
  const handleUserOpen = buildUserOpenHandler(onClose, onNavChange);
  const handleCalendarOpen = buildCalendarOpenHandler(onClose, onNavChange);
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

function SharedWithModal({ userId, state, onNavChange }) {
  return (
    <SocialDataModal
      isOpen={state.showSharedWith}
      onClose={() => state.setShowSharedWith(false)}
      titleMode="shared_with"
      fetchFn={socialDataFetchers.sharingWith}
      userId={userId}
      onNavChange={onNavChange}
      onUserUpdate={state.reload}
      emptyHint="No one can see your calendar events yet."
    />
  );
}

function SharedByModal({ userId, state, onNavChange }) {
  return (
    <SocialDataModal
      isOpen={state.showSharedBy}
      onClose={() => state.setShowSharedBy(false)}
      titleMode="sharing_with_me"
      fetchFn={socialDataFetchers.sharedWithMe}
      userId={userId}
      onNavChange={onNavChange}
      onUserUpdate={state.reload}
      emptyHint="No one has shared their calendar events with you yet."
      showCalendarAction
    />
  );
}

function SharingModals({ user, state, onNavChange }) {
  const userId = (state.profileData || user)?.id;
  return (
    <>
      <SharedWithModal userId={userId} state={state} onNavChange={onNavChange} />
      <SharedByModal userId={userId} state={state} onNavChange={onNavChange} />
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
