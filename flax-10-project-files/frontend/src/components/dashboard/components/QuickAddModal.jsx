import { useState, useEffect } from "react";
import styles from "../styles/QuickAddModal.module.css";
import { useTags } from "../../../context/TagContext";
import Badge from "../../common/Badge/Badge";
import StandardModal from "../../common/standard_modal/StandardModal";
import { getModules } from "../../../api/moduleApi";

const CORE_TYPES = [
  { id: 'event', icon: '📅', label: 'Event', color: 'var(--color-light-blue)' },
  { id: 'society', icon: '👨‍👨‍👧‍👧', label: 'Society', color: 'var(--personal)' },
  { id: 'task', icon: '✅', label: 'Task', color: 'var(--color-teal)' },
];

//Unlock when features are implemented
const LOCK_TYPES = [
  { id: 'group', icon: '👥', label: 'Group', color: 'var(--color-muted-slate)', locked: true },
];

function tileStyle(item) {
  if (item.locked) return { backgroundColor: 'var(--color-bg-muted)', borderColor: 'var(--color-border-light-slate)', cursor: 'not-allowed' };
  return { backgroundColor: `${item.color}15`, borderColor: `${item.color}30` };
}

function Tile({ item, onClick }) {
  return (
    <button className={styles.tile} onClick={onClick} type="button" style={tileStyle(item)} disabled={item.locked}>
      <span className={styles.icon}>{item.icon}</span>
      <span className={styles.label} style={{ color: item.locked ? 'var(--color-gray-400)' : item.color }}>{item.label}</span>
      {item.locked && <Badge className={styles.badge} tone="muted">Coming Soon</Badge>}
    </button>
  );
}

function TypeGrid({ onType, isTeacher }) {
  const types = [...CORE_TYPES];
  if (isTeacher) types.push({ id: 'module', icon: '📚', label: 'Module', color: 'var(--color-teal)' });
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
    { id: 'create_module', icon: '✨', label: 'Create New Module', color: 'var(--color-teal)' },
    { id: 'add_deadline', icon: '⏰', label: 'Add Deadline', color: 'var(--color-error)' },
    { id: 'add_reading', icon: '📖', label: 'Add Reading', color: 'var(--color-amber)' },
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
  if (!modules.length) return <p className={styles.emptyMsg}>Loading or no modules found.</p>;
  return (
    <div className={styles.grid}>
      {modules.map(m => (
        <Tile key={m.id} item={{ id: m.id, icon: '📔', label: m.module_code, color: 'var(--color-teal)' }} onClick={() => onSelect(m)} />
      ))}
    </div>
  );
}

function useQuickAddLogic(onSelectType, initialView) {
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
    else onSelectType(id);
  };
  return { tags, view, handleType };
}

function normalizeQuickAddView(view) {
  if (view === 'schedule_manual' || view === 'schedule_auto') return 'type';
  return view || 'type';
}

function getHeader(view) {
  const titles = {
    module: { title: 'Module Options', sub: 'Create a module, add a deadline or reading ' },
    tag: { title: 'Choose Event Tag', sub: 'What kind of event is this?' },
    module_picker: { title: 'Select Module', sub: 'Which module is this deadline for?' },
    module_picker_reading: { title: 'Select Module', sub: 'Which module is this reading for? ' }
  };
  return titles[view] || { title: 'Quick Add', sub: 'What would you like to add?' };
}

export default function QuickAddModal({ onClose, onSelectType, isTeacher, initialView = 'type' }) {
  const { tags, view, handleType } = useQuickAddLogic(onSelectType, initialView);
  const { title, sub } = getHeader(view);
  const handlePickerSelect = (m) => onSelectType('add_deadline', m);
  const handleReadingPickerSelect = (m) => onSelectType('add_reading', m);
  return (
    <StandardModal title={title} subtitle={sub} onClose={onClose}>
      {view === 'type' && <TypeGrid onType={handleType} isTeacher={isTeacher} />}
      {view === 'tag' && <TagGrid tags={tags} onSelect={onSelectType} />}
      {view === 'module' && <ModuleOptsGrid onSelect={handleType} />}
      {view === 'module_picker' && <ModulePickerGrid onSelect={handlePickerSelect} />}
      {view === 'module_picker_reading' && <ModulePickerGrid onSelect={handleReadingPickerSelect} />}
    </StandardModal>
  );
}
