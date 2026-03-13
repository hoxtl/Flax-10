import { useState, useEffect } from "react";
import styles from "./QuickAddModal.module.css";
import { useTags } from "../../context/TagContext";
import Badge from "../common/Badge/Badge";
import StandardModal from "../common/StandardModal/StandardModal";
import { getModules } from "../../api/moduleApi";

const CORE_TYPES = [
  { id: 'event', icon: '📅', label: 'Event', color: '#3b82f6' },
  { id: 'society', icon: '👨‍👨‍👧‍👧', label: 'Society', color: '#8b5cf6' },
  { id: 'task', icon: '✅', label: 'Task', color: '#10b981' },
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
    else onSelectType(id);
  };
  return { tags, view, handleType };
}

function getHeader(view) {
  if (view === 'module') return { title: 'Module Options', sub: 'Create a module or add a deadline' };
  if (view === 'tag') return { title: 'Choose Event Tag', sub: 'What kind of event is this?' };
  if (view === 'module_picker') return { title: 'Select Module', sub: 'Which module is this deadline for?' };
  return { title: 'Quick Add', sub: 'What would you like to add?' };
}

export default function QuickAddModal({ onClose, onSelectType, isTeacher }) {
  const { tags, view, handleType } = useQuickAddLogic(onSelectType);
  const { title, sub } = getHeader(view);
  const handlePickerSelect = (m) => onSelectType('add_deadline', m);

  return (
    <StandardModal title={title} subtitle={sub} onClose={onClose}>
      {view === 'type' && <TypeGrid onType={handleType} isTeacher={isTeacher} />}
      {view === 'tag' && <TagGrid tags={tags} onSelect={onSelectType} />}
      {view === 'module' && <ModuleOptsGrid onSelect={handleType} />}
      {view === 'module_picker' && <ModulePickerGrid onSelect={handlePickerSelect} />}
    </StandardModal>
  );
}
