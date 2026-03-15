import { useState, useEffect } from "react";
import styles from "./QuickAddModal.module.css";
import { useTags } from "../../context/TagContext";
import StandardModal from "../common/StandardModal/StandardModal";
import { getModules } from "../../api/moduleApi";
import { getEvents } from "../../api/eventApi";
import { getUpcomingDeadlines } from "../../api/deadlineApi";
import { createSchedule } from "../../api/scheduleApi";
import { useNotifications } from "../../context/NotificationContext";

const CORE_TYPES = [
  { id: 'event', icon: '📅', label: 'Event', color: '#3b82f6' },
  { id: 'society', icon: '👨‍👨‍👧‍👧', label: 'Society', color: '#8b5cf6' },
  { id: 'schedule', icon: '🗓️', label: 'Schedule', color: '#ffd62e'}
];

//Unlock when features are implemented
const LOCK_TYPES = [
  { id: 'group', icon: '👥', label: 'Group', color: '#cbd5e1', locked: true },
  { id: 'task', icon: '✅', label: 'Task', color: '#cbd5e1', locked: true },
];

function tileStyle(item) {
  if (item.locked) return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', cursor: 'not-allowed' };
  return { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` };
}

function Tile({ item, onClick }) {
  return (
    <button className={styles.tile} onClick={onClick} type="button" style={tileStyle(item)} disabled={item.locked}>
      <span className={styles.icon}>{item.icon}</span>
      <span className={styles.label} style={{ color: item.locked ? '#94a3b8' : item.color }}>{item.label}</span>
      {item.locked && <span className={styles.badge}>Coming Soon</span>}
    </button>
  );
}

function TypeGrid({ onType, isTeacher }) {
  const types = [...CORE_TYPES];
  if (isTeacher) types.push({ id: 'module', icon: '📚', label: 'Module', color: '#10b981' });
  const allTypes = [...types, ...LOCK_TYPES];
  return (
    <div className={styles.grid}>
      {allTypes.map(t => <Tile key={t.id} item={t} onClick={() => onType(t.id)} />)}
    </div>
  );
}

function TagGrid({ tags, onSelect }) {
  return (
    <div className={styles.grid}>
      {tags.map(tag => (
        <Tile key={tag.id} item={tag} onClick={() => onSelect(tag.id)} />
      ))}
    </div>
  );
}

function ModuleOptsGrid({ onSelect }) {
  const opts = [
    { id: 'create_module', icon: '✨', label: 'Create New Module', color: '#10b981' },
    { id: 'add_deadline', icon: '⏰', label: 'Add Deadline', color: '#ef4444' }
  ];
  return (
    <div className={styles.grid}>
      {opts.map(o => <Tile key={o.id} item={o} onClick={() => onSelect(o.id)} />)}
    </div>
  );
}

function useTeacherModules() {
  const [modules, setModules] = useState([]);
  useEffect(() => { getModules().then(setModules).catch(() => { }); }, []);
  return modules;
}

function ModulePickerGrid({ onSelect }) {
  const modules = useTeacherModules();
  if (!modules.length) return <p style={{ textAlign: "center", color: "#6b7280" }}>Loading or no modules found.</p>;
  return (
    <div className={styles.grid}>
      {modules.map(m => (
        <Tile key={m.id} item={{ id: m.id, icon: '📔', label: m.module_code, color: '#10b981' }} onClick={() => onSelect(m)} />
      ))}
    </div>
  );
}

function useQuickAddLogic(onSelectType) {
  const { tags } = useTags();
  const [view, setView] = useState('type');
  const handleType = (id) => {
    if (id === 'event') setView('tag');
    else if (id === 'module') setView('module');
    else if (id === 'add_deadline') setView('module_picker');
    else if (id === 'schedule') setView('schedule');
    else if (id === 'schedule_manual') setView('schedule_manual');
    else if (id === 'schedule_auto') setView('schedule_auto');
    else onSelectType(id);
  };
  return { tags, view, handleType };
}

function getHeader(view) {
  if (view === 'module') return { title: 'Module Options', sub: 'Create a module or add a deadline' };
  if (view === 'tag') return { title: 'Choose Event Tag', sub: 'What kind of event is this?' };
  if (view === 'module_picker') return { title: 'Select Module', sub: 'Which module is this deadline for?' };
  if (view === 'schedule') return {title: 'Add Schedule', sub: 'Make schedule out of current calendar or auto schedule?'}
  if (view === 'schedule_manual') return { title: 'Manual Schedule', sub: 'Name it and pick existing events tagged as schedule.' };
  if (view === 'schedule_auto') return { title: 'Auto Schedule', sub: 'Generate schedule blocks from upcoming deadlines.' };
  return { title: 'Quick Add', sub: 'What would you like to add?' };
}

export default function QuickAddModal({ onClose, onSelectType, isTeacher }) {
  const { tags, view, handleType } = useQuickAddLogic(onSelectType);
  const { title, sub } = getHeader(view);
  const handlePickerSelect = (m) => onSelectType('add_deadline', m);
  const done = () => onClose?.();

  return (
    <StandardModal title={title} subtitle={sub} onClose={onClose}>
      {view === 'type' && <TypeGrid onType={handleType} isTeacher={isTeacher} />}
      {view === 'tag' && <TagGrid tags={tags} onSelect={onSelectType} />}
      {view === 'module' && <ModuleOptsGrid onSelect={handleType} />}
      {view === 'module_picker' && <ModulePickerGrid onSelect={handlePickerSelect} />}
      {view === 'schedule' && <ScheduleModeGrid onSelect={handleType} />}
      {view === 'schedule_manual' && <ScheduleManualForm onDone={done} />}
      {view === 'schedule_auto' && <ScheduleAutoForm onDone={done} />}
    </StandardModal>
  );
}

function ScheduleModeGrid({ onSelect }) {
  const opts = [
    { id: 'schedule_manual', icon: '🧩', label: 'Add Existing Scheduled Events', color: '#f59e0b' },
    { id: 'schedule_auto', icon: '⚙️', label: 'Auto Schedule from Deadlines', color: '#0ea5e9' },
  ];
  return <div className={styles.grid}>{opts.map(o => <Tile key={o.id} item={o} onClick={() => onSelect(o.id)} />)}</div>;
}

function ScheduleManualForm({ onDone }) {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    getEvents().then((all) => {
      const scheduleTagged = all.filter(e => (e.tag_name || '').toLowerCase() === 'schedule');
      setEvents(scheduleTagged);
      setSelected(scheduleTagged.map(e => e.id));
    }).catch(() => addNotification({ title: 'Schedule', message: 'Unable to load schedule-tagged events.', notification_type: 'general' }));
  }, [addNotification]);

  const filteredEvents = events.filter((event) => {
    const query = eventSearch.trim().toLowerCase();
    if (!query) return true;
    return (event.title || '').toLowerCase().includes(query);
  });


  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  const submit = async () => {
    if (!title.trim()) return addNotification({ title: 'Schedule name required', message: 'Please enter a schedule name.', notification_type: 'general' });
    if (!selected.length) return addNotification({ title: 'No events selected', message: 'Select at least one event tagged as schedule.', notification_type: 'general' });
    try {
      const data = await createSchedule({ mode: 'manual', title: title.trim(), event_ids: selected });
      if (data.overwritten) {
        addNotification({ title: 'Schedule overwritten', message: 'A schedule with this name existed and was replaced.', notification_type: 'general' });
      }
      addNotification({ title: 'Schedule created', message: `Saved ${selected.length} events to ${title.trim()}.`, notification_type: 'general' });
      onDone?.();
    } catch (e) {
      addNotification({ title: 'Create schedule failed', message: e.message, notification_type: 'general' });
    }
  };

  return (
    <div className={styles.formWrap}>
      <label className={styles.fieldLabel}>Schedule name</label>
      <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="My study schedule" />
      <label className={styles.fieldLabel}>Search events</label>
      <input
        className={styles.input}
        value={eventSearch}
        onChange={e => setEventSearch(e.target.value)}
        placeholder="Search schedule events"
      />
      <div className={styles.eventList}>
        {events.length === 0 && <p className={styles.muted}>No events tagged "schedule" were found.</p>}
        {events.length > 0 && filteredEvents.length === 0 && <p className={styles.muted}>No events match your search.</p>}
        {filteredEvents.map(e => (
          <label key={e.id} className={styles.checkRow}>
            <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} />
            <span>{e.title}</span>
          </label>
        ))}
      </div>
      <button className={styles.primaryBtn} type="button" onClick={submit}>Create Schedule</button>
    </div>
  );
}

function ScheduleAutoForm({ onDone }) {
  const { addNotification } = useNotifications();
  const [title, setTitle] = useState('Auto schedule');
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    getUpcomingDeadlines().then(setDeadlines).catch(() => addNotification({ title: 'Schedule', message: 'Unable to load upcoming deadlines.', notification_type: 'general' }));
  }, [addNotification]);

  const submit = async () => {
    if (!deadlines.length) return addNotification({ title: 'No deadlines', message: 'No upcoming deadlines to auto-schedule.', notification_type: 'general' });
    const payload = {
      title: title.trim() || 'Auto schedule',
      worktime_preference: 'both',
      week_preference: 'both',
      deadline_preferences: deadlines.map(d => ({ deadline_id: d.id, ideal_minutes_per_day: 60 })),
    };
    try {
      const data = await createSchedule(payload);
      if (data.overwritten) {
        addNotification({ title: 'Schedule overwritten', message: 'A schedule with this name existed and was replaced.', notification_type: 'general' });
      }
      addNotification({ title: 'Auto schedule created', message: `Generated schedule: ${payload.title}.`, notification_type: 'general' });
      onDone?.();
    } catch (e) {
      addNotification({ title: 'Auto schedule failed', message: e.message, notification_type: 'general' });
    }
  };

  return (
    <div className={styles.formWrap}>
      <label className={styles.fieldLabel}>Schedule name</label>
      <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Auto schedule" />
      <p className={styles.muted}>Will schedule {deadlines.length} upcoming deadlines with 60 min/day blocks.</p>
      <button className={styles.primaryBtn} type="button" onClick={submit}>Generate Auto Schedule</button>
    </div>
  );
}
