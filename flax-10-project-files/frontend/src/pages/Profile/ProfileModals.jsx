import styles from "./Profile.module.css";
import EditProfileModal from "../../components/Dashboard/EditProfileModal";
import { fetchTasks } from "../../api/taskService";
import { RANGE_OPTIONS, getRangeLabel, DATE_FORMAT, TIME_FORMAT } from "./utils/profileHelpers";
import { useState, useEffect } from "react";
import { getSharingWith, getSharedWithMe } from "../../api/socialService";
import UserListModal from "../../components/Social/UserListModal";
import GenericSummaryModal from "../../components/common/GenericSummaryModal/GenericSummaryModal";
import SummaryItem from "../../components/common/GenericSummaryModal/SummaryItem";

function RangeButtons({ range, onRangeChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', justifyContent: 'space-between' }}>
      {RANGE_OPTIONS.map(([key, label]) => (
        <RangeButton key={key} isActive={range === key} label={label} onClick={() => onRangeChange(key)} />
      ))}
    </div>
  );
}

function RangeButton({ isActive, label, onClick }) {
  const style = {
    flex: 1, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s ease',
    background: isActive ? '#8b6e4e' : 'transparent',
    color: isActive ? '#fff' : 'var(--text, #1f2937)',
    fontWeight: isActive ? '600' : '500',
  };
  return <button style={style} onClick={onClick}>{label}</button>;
}

function formatEventMeta(event) {
  const date = new Date(event.start_time);
  const dateStr = date.toLocaleDateString('en-GB', DATE_FORMAT);
  const timeStr = date.toLocaleTimeString('en-GB', TIME_FORMAT);
  return `${dateStr} at ${timeStr}${event.location ? ` • ${event.location}` : ''}`;
}

function EventsModal({ isOpen, onClose, events, range, onRangeChange }) {
  const title = `Events - ${getRangeLabel(range)} (${events.length})`;
  return (
    <GenericSummaryModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      emptyMessage="No events found for this period"
      topContent={<RangeButtons range={range} onRangeChange={onRangeChange} />}
      items={events}
      renderItem={(event, i) => (
        <SummaryItem key={i} avatar="📅" title={event.title} subtitle={formatEventMeta(event)} />
      )}
    />
  );
}

function ModulesModal({ isOpen, onClose, modules, onNavigate }) {
  return (
    <GenericSummaryModal
      isOpen={isOpen}
      onClose={onClose}
      title="Modules"
      emptyMessage="No modules found"
      items={modules}
      renderItem={(code, i) => (
        <SummaryItem
          key={i}
          avatar="📚"
          title={code}
          subtitle="Module"
          onClick={() => { onClose?.(); onNavigate?.(`modules_${code}`); }}
        />
      )}
    />
  );
}

function formatTaskMeta(task) {
  const dueDate = task?.due_date
    ? new Date(task.due_date).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No due date";
  const listName = task?.task_list_name || task?.list_name || task?.module_code || "Task";
  return `${dueDate} • ${listName}`;
}

function useTasksModalData(isOpen) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTasks()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        const sorted = list
          .filter((task) => !task.completed)
          .sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
          });
        setTasks(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch tasks for profile modal", err);
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  return { tasks, loading };
}

function TasksModal({ isOpen, onClose }) {
  const { tasks, loading } = useTasksModalData(isOpen);

  return (
    <GenericSummaryModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tasks${tasks.length ? ` (${tasks.length})` : ""}`}
      emptyMessage="No active tasks right now."
      loading={loading}
      items={tasks}
      renderItem={(task, i) => (
        <SummaryItem
          key={task.id ?? i}
          avatar="✓"
          title={task.title}
          subtitle={formatTaskMeta(task)}
        />
      )}
    />
  );
}

function SocialDataModal({ isOpen, onClose, title, fetchFn, userId, onNavChange, onUserUpdate }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFn(userId)
        .then(data => setUsers(data.results || data))
        .catch(err => console.error("Failed to fetch users", err));
    } else {
      setUsers([]);
    }
  }, [isOpen, userId, fetchFn]);

  if (!isOpen) return null;

  return (
    <UserListModal
      title={title}
      users={users}
      onClose={onClose}
      onUserClick={(u) => {
        onClose(); // close the modal first
        if (onNavChange) onNavChange(`profile_${u.id}`);
      }}
      onUserUpdate={onUserUpdate}
    />
  );
}

function EditProfileSection({ state }) {
  const { showEditProfile, setShowEditProfile, handleSaveProfile, profileData } = state;
  return (
    <EditProfileModal
      user={profileData}
      isOpen={showEditProfile}
      onClose={() => setShowEditProfile(false)}
      onSave={handleSaveProfile}
    />
  );
}

function ProfileEditModals({ user, state, modules, visibility, onNavChange }) {
  const { showModules, setShowModules, showTasks, setShowTasks, profileData } = state;
  return (
    <>
      {visibility.canEditProfile && <EditProfileSection state={state} />}
      {visibility.canViewModules && <ModulesModal isOpen={showModules} onClose={() => setShowModules(false)} modules={modules} onNavigate={onNavChange} />}
      {visibility.canViewTasks && <TasksModal isOpen={showTasks} onClose={() => setShowTasks(false)} />}
      {visibility.canViewSharedWith && <SharingModals user={user} state={state} profileData={profileData} onNavChange={onNavChange} />}
    </>
  );
}

function SharingModals({ user, state, profileData, onNavChange }) {
  return (
    <>
      <SocialDataModal isOpen={state.showSharedWith} onClose={() => state.setShowSharedWith(false)} title="Sharing With" fetchFn={getSharingWith} userId={(profileData || user)?.id} onNavChange={onNavChange} onUserUpdate={state.reload} />
      <SocialDataModal isOpen={state.showSharedBy} onClose={() => state.setShowSharedBy(false)} title="Shared By" fetchFn={getSharedWithMe} userId={(profileData || user)?.id} onNavChange={onNavChange} onUserUpdate={state.reload} />
    </>
  );
}

function EventsModalContainer({ state, filteredEvents, visibility }) {
  const { showEvents, setShowEvents, eventRange, setEventRange } = state;
  if (!visibility.canViewEvents) return null;
  return <EventsModal isOpen={showEvents} onClose={() => setShowEvents(false)} events={filteredEvents} range={eventRange} onRangeChange={setEventRange} />;
}

export default function ProfileModals({ user, state, modules, filteredEvents, visibility, onNavChange }) {
  return (
    <>
      <ProfileEditModals user={user} state={state} modules={modules} visibility={visibility} onNavChange={onNavChange} />
      <EventsModalContainer state={state} filteredEvents={filteredEvents} visibility={visibility} />
    </>
  );
}
