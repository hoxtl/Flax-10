import { useState, useEffect } from "react";
import styles from "./QuickAddModal.module.css";
import { useTags } from "../../context/TagContext";
import Badge from "../Common/Badge/Badge";
import StandardModal from "../Common/StandardModal/StandardModal";
import { getModules } from "../../api/modules/moduleApi";
import { ScheduleAutoForm } from "../Schedules/ScheduleForms";

const CORE_TYPES = [
  { id: 'event', icon: '📅', label: 'Event', color: '#3b82f6' },
  { id: 'society', icon: '👨‍👨‍👧‍👧', label: 'Society', color: '#8b5cf6' },
  { id: 'task', icon: '✅', label: 'Task', color: '#10b981' },
  { id: 'schedule_auto', icon: '⚙️', label: 'Auto Schedule', color: '#0ea5e9' },
];

//Unlock when features are implemented
const LOCK_TYPES = [
  { id: 'group', icon: '👥', label: 'Group', color: '#cbd5e1', locked: true },
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
      {item.locked && <Badge className={styles.badge} tone="muted">Coming Soon</Badge>}
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
    { id: 'add_deadline', icon: '⏰', label: 'Add Deadline', color: '#ef4444' },
    { id: 'add_reading', icon: '📖', label: 'Add Reading', color: '#f59e0b'},
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

function useQuickAddLogic(onSelectType, initialView = 'type') {
  const { tags } = useTags();
  const [view, setView] = useState(normalizeQuickAddView(initialView));

  useEffect(() => {
    setView(normalizeQuickAddView(initialView));
  }, [initialView]);
  const handleType = (id) => {
    if (id === 'event') setView('tag');
    else if (id === 'module') setView('module');
    else if (id === 'add_deadline') setView('module_picker');
    else if (id === 'add_reading') setView('module_picker_reading');
    else if (id === 'schedule_auto') setView('schedule_auto');
    else onSelectType(id);
  };
  return { tags, view, handleType };
}

function normalizeQuickAddView(view) {
  if (view === 'schedule_manual') return 'schedule_auto';
  return view || 'type';
}

function getHeader(view) {
  if (view === 'module') return { title: 'Module Options', sub: 'Create a module, add a deadline or reading ' };
  if (view === 'tag') return { title: 'Choose Event Tag', sub: 'What kind of event is this?' };
  if (view === 'module_picker') return { title: 'Select Module', sub: 'Which module is this deadline for?' };
  if (view === 'module_picker_reading') return { title: 'Select Module', sub: 'Which module is this reading for? '};
  if (view === 'schedule_auto') return { title: 'Auto Schedule', sub: 'Generate schedule blocks from upcoming deadlines.' };
  return { title: 'Quick Add', sub: 'What would you like to add?' };
}

export default function QuickAddModal({ onClose, onSelectType, isTeacher, initialView = 'type' }) {
  const { tags, view, handleType } = useQuickAddLogic(onSelectType, initialView);
  const { title, sub } = getHeader(view);
  const handlePickerSelect = (m) => onSelectType('add_deadline', m);
  const handleReadingPickerSelect = (m) => onSelectType('add_reading', m);
  const done = () => onClose?.();
  return (
    <StandardModal title={title} subtitle={sub} onClose={onClose}>
      {view === 'type' && <TypeGrid onType={handleType} isTeacher={isTeacher} />}
      {view === 'tag' && <TagGrid tags={tags} onSelect={onSelectType} />}
      {view === 'module' && <ModuleOptsGrid onSelect={handleType} />}
      {view === 'module_picker' && <ModulePickerGrid onSelect={handlePickerSelect} />}
      {view === 'module_picker_reading' && <ModulePickerGrid onSelect={handleReadingPickerSelect} />}
      {view === 'schedule_auto' && <ScheduleAutoForm onDone={done} />}
    </StandardModal>
  );
}
