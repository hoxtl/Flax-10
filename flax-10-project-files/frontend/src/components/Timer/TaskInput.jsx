import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import SearchBar from '../common/SearchBar/SearchBar';
import SearchEmptyState from '../common/SearchEmptyState/SearchEmptyState';
import SkeletonBlock from '../common/LoadingState/SkeletonBlock';
import { FOCUS_BLOCK_COLOURS_HEX } from '../../pages/Tasks/constants/focusBlockColours';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import StandardModal from '../common/StandardModal/StandardModal';
import AnimatedDropdown from '../common/AnimatedDropdown';
import TaskFeedFilterPanel from '../../pages/Tasks/components/TaskFeedFilterPanel';
import { isEnrolledIn } from '../Modules/utils/moduleUtils';
import { compareTaskPriority, compareTaskDue, compareTaskEstimatedTime, getTaskDurationMinutes } from '../../lib/focusPlanner';

const SORT_URGENCY = 'urgency';
const SORT_TIME = 'time';
const SORT_DUE = 'due';
const SORT_ALPHA = 'alpha';
const SORT_DATE_ADDED = 'date_added';

const SORT_OPTIONS = [
    { value: SORT_URGENCY,    label: 'Urgency' },
    { value: SORT_DUE,        label: 'Due date' },
    { value: SORT_ALPHA,      label: 'A → Z' },
    { value: SORT_DATE_ADDED, label: 'Date added' },
    { value: SORT_TIME,       label: 'Estimated time' },
];


const getTaskUrgencyTone = (task) => {
    const raw = task?.due_date || task?.dueDate;
    if (!raw) return 'cool';
    const due = new Date(raw);
    if (Number.isNaN(due.getTime())) return 'cool';
    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    if (due.getTime() <= endOfToday.getTime()) return 'hot';
    if ((due.getTime() - now.getTime()) / 3600000 <= 48) return 'warm';
    return 'cool';
};

const normalizeModuleCode = (code) => String(code || '').trim().toUpperCase();
const urgencyRank = (task) => { const t = getTaskUrgencyTone(task); return t === 'hot' ? 0 : t === 'warm' ? 1 : 2; };
const moduleCodePrefix = (code = '') => code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || 'Other';

const sortTasks = (list, sort) => {
    if (sort === SORT_TIME) return list.sort(compareTaskEstimatedTime);
    if (sort === SORT_DUE) return list.sort(compareTaskDue);
    if (sort === SORT_ALPHA) return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    if (sort === SORT_DATE_ADDED) return list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    return list.sort(compareTaskPriority);
};

function TaskPickItem({ task, value, recommendedTaskId, onSelect }) {
    const urgencyTone = getTaskUrgencyTone(task);
    const isSelected = value === task.title;
    const isRecommended = recommendedTaskId === task.id;
    const urgencyClass = urgencyTone === 'hot' ? styles.taskPickItemHot : urgencyTone === 'warm' ? styles.taskPickItemWarm : styles.taskPickItemCool;
    const taskMarker = urgencyTone === 'hot' ? '🔥' : task.module_code ? '🦁' : null;
    const moduleOrList = task.module_code || task.list_name;
    return (
        <button
            key={task.id} type="button"
            className={`${styles.taskPickItem} ${urgencyClass} ${isSelected ? styles.taskPickItemSelected : ''} ${isRecommended ? styles.taskPickItemRecommended : ''}`}
            onClick={() => onSelect(task)} title={task.title}
        >
            <div className={styles.taskPickItemContent}>
                <span className={styles.taskPickSingleLine}>
                    <span className={styles.taskPickTitleRow}>
                        {taskMarker && <span className={styles.taskPickPriorityIcon}>{taskMarker}</span>}
                        <span className={styles.taskPickTitle}>{task.title}</span>
                    </span>
                    <span className={styles.taskPickInlineMeta}>
                        <span className={styles.taskPickDurationInline}>{getTaskDurationMinutes(task)} mins</span>
                        <span className={styles.taskPickMetaDivider}>•</span>
                        <span className={styles.taskPickMetaLine}>{moduleOrList}</span>
                    </span>
                </span>
            </div>
        </button>
    );
}

export function TaskInput({ value, onChange, onClearTask, onTaskSelect, onJustStart, isSessionActive = false, onOpenFocus }) {
    const [open, setOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState(SORT_URGENCY);
    const [search, setSearch] = useState('');
    const [recommendedTaskId, setRecommendedTaskId] = useState(null);
    const [filterListIds, setFilterListIds] = useState([]);
    const [filterModuleCodes, setFilterModuleCodes] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('lists');
    const [filterQuery, setFilterQuery] = useState('');
    const [enrolledModules, setEnrolledModules] = useState([]);
    const ref = useRef(null);
    const filterWrapRef = useRef(null);

    const handleModalMouseDown = useCallback((e) => {
        if (isFilterOpen && filterWrapRef.current && !filterWrapRef.current.contains(e.target)) {
            setIsFilterOpen(false);
        }
    }, [isFilterOpen]);

    const loadTasks = useCallback((sort = sortBy) => {
        setLoading(true);
        Promise.all([
            import('../../api/taskService').then(({ fetchTasks }) => fetchTasks()),
            import('../../api/taskService').then(({ fetchTaskLists }) => fetchTaskLists()),
        ])
            .then(([tasksData, listsData]) => {
                const listMap = {};
                (listsData || []).forEach((list, idx) => {
                    listMap[String(list.id)] = {
                        name: list.name || 'Other',
                        color: list.color || FOCUS_BLOCK_COLOURS_HEX[idx % FOCUS_BLOCK_COLOURS_HEX.length],
                    };
                });
                setLists(listsData || []);
                const list = (tasksData || []).filter(t => !t.completed).map(t => {
                    const info = listMap[String(t.task_list)] || { name: 'Other', color: '#94a3b8' };
                    return { ...t, list_name: info.name, list_color: info.color };
                });
                setTasks(sortTasks(list, sort).slice(0, 100));
            })
            .catch(() => setTasks([]))
            .finally(() => setLoading(false));
    }, [sortBy]);

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    useEffect(() => {
        let active = true;
        import('../../api/moduleApi').then(({ getModules, getEnrollments }) => {
            Promise.all([getModules(), getEnrollments()]).then(([allMods, enrollments]) => {
                if (!active) return;
                const enrolled = (allMods || []).filter(m => isEnrolledIn(m.id, enrollments || []));
                setEnrolledModules(enrolled.map(m => ({
                    code: normalizeModuleCode(m.module_code),
                    name: String(m.module_name || m.title || '').trim(),
                })).filter(m => m.code));
            }).catch(() => {});
        });
        return () => { active = false; };
    }, []);

    const listItems = useMemo(() => (lists || []).map(l => ({ value: String(l.id), label: l.name || 'List' })), [lists]);

    const moduleItems = useMemo(() => {
        const byCode = new Map();
        enrolledModules.forEach(m => { if (m.code) byCode.set(m.code, m.name); });
        tasks.forEach(t => {
            const code = normalizeModuleCode(t.module_code);
            if (code && !byCode.has(code)) byCode.set(code, String(t.module_name || '').trim());
        });
        return Array.from(byCode.entries()).sort(([a], [b]) => a.localeCompare(b))
            .map(([code, name]) => ({ value: code, label: name ? `${code} — ${name}` : code }));
    }, [enrolledModules, tasks]);

    const visibleListItems = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        return !q ? listItems : listItems.filter(o => o.label.toLowerCase().includes(q));
    }, [listItems, filterQuery]);

    const groupedModuleItems = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        const base = !q ? moduleItems : moduleItems.filter(o => o.label.toLowerCase().includes(q));
        return base.reduce((acc, item) => {
            const k = moduleCodePrefix(item.value);
            if (!acc[k]) acc[k] = [];
            acc[k].push(item);
            return acc;
        }, {});
    }, [moduleItems, filterQuery]);

    const moduleGroupKeys = useMemo(() => Object.keys(groupedModuleItems).sort(), [groupedModuleItems]);

    const toggleList = (listId) => setFilterListIds(prev => {
        const str = String(listId);
        return prev.includes(str) ? prev.filter(id => id !== str) : [...prev, str];
    });
    const toggleModule = (code) => setFilterModuleCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    const clearAllFilters = () => { setFilterListIds([]); setFilterModuleCodes([]); setFilterQuery(''); };

    const searchLower = (search || '').toLowerCase().trim();
    let filteredTasks = searchLower
        ? tasks.filter(t => (t.title || '').toLowerCase().includes(searchLower) || (t.list_name || '').toLowerCase().includes(searchLower) || (t.module_code || '').toLowerCase().includes(searchLower))
        : tasks;
    if (filterListIds.length > 0) {
        const set = new Set(filterListIds.map(String));
        filteredTasks = filteredTasks.filter(t => set.has(String(t.task_list)));
    }
    if (filterModuleCodes.length > 0) {
        const set = new Set(filterModuleCodes);
        filteredTasks = filteredTasks.filter(t => set.has(normalizeModuleCode(t.module_code)));
    }

    const recommendedTask = useMemo(() => {
        if (!filteredTasks.length) return null;
        return [...filteredTasks].sort((a, b) => {
            const diff = urgencyRank(a) - urgencyRank(b);
            return diff !== 0 ? diff : compareTaskDue(a, b);
        })[0] || null;
    }, [filteredTasks]);

    const selectTask = (task) => { onChange(task.title); setOpen(false); onTaskSelect?.(task); };
    const handleClearTask = () => { onChange(''); onClearTask?.(); setRecommendedTaskId(null); };
    const handlePickForMe = () => {
        if (!recommendedTask) return;
        setRecommendedTaskId(recommendedTask.id);
        window.setTimeout(() => selectTask(recommendedTask), 140);
    };

    const isCompact = Boolean(isSessionActive && value);
    const hasTaskValue = Boolean((value || '').trim());
    const activeFilterCount = filterListIds.length + filterModuleCodes.length;

    return (
        <div className={styles.taskInputWrap}>
            {value && <div className={styles.currentTaskLabel}>Currently focusing on:</div>}
            <div className={styles.taskInputContainer} ref={ref}>
                <input
                    type="text"
                    className={`${styles.taskInput} ${value ? styles.taskInputHasValue : ''} ${isCompact ? styles.taskInputCompact : ''}`}
                    placeholder={isCompact ? 'Task in progress' : 'What are you working on? 🎯'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                />
                {!isCompact ? (
                    <div className={styles.taskInputActions}>
                        <div className={styles.taskInputActionsRow}>
                            <PrimaryButton variant="primary" pill className={styles.taskPickBtn} onClick={() => { if (!open) loadTasks(); setOpen(o => !o); }} title="Select a task">
                                Choose a task to focus
                            </PrimaryButton>
                            {typeof onOpenFocus === 'function' && (
                                <PrimaryButton variant="secondary" pill className={styles.fullFocusInlineBtn} onClick={onOpenFocus}>
                                    Full Focus Mode ⚡
                                </PrimaryButton>
                            )}
                        </div>
                        {hasTaskValue && <button type="button" className={styles.taskClearBtn} onClick={handleClearTask} title="Clear selected task">Clear task</button>}
                    </div>
                ) : (
                    <div className={`${styles.taskInputActions} ${styles.taskInputActionsCompact}`}>
                        <button type="button" className={styles.taskPickBtn} onClick={() => { if (!open) loadTasks(); setOpen(o => !o); }} title="Change task">Change task</button>
                        {hasTaskValue && <button type="button" className={styles.taskClearBtn} onClick={handleClearTask} title="Clear selected task">Clear task</button>}
                    </div>
                )}
                <StandardModal
                    onClose={() => setOpen(false)}
                    size="md" hideHeader
                    backdropClassName={!open ? styles.hidden : styles.taskPickBackdrop}
                    modalClassName={!open ? styles.hidden : styles.taskPickDropdown}
                    contentClassName={styles.taskPickContent}
                >
                    {open && (
                        <div onMouseDown={handleModalMouseDown}>
                            <div className={styles.taskPickHeader}>
                                <div className={styles.taskPickHeaderCopy}>
                                    <h2 className={styles.taskPickHeaderTitle}>Select a Task</h2>
                                </div>
                                <button type="button" className={styles.taskPickCloseBtn} onClick={() => setOpen(false)} aria-label="Close task picker">×</button>
                            </div>
                            <div className={styles.taskPickFiltersBar}>
                                <div className={styles.taskPickToolbarRow}>
                                    <SearchBar value={search} onChange={setSearch} placeholder="Search tasks…" className={styles.taskPickSearch} />
                                    <div className={styles.taskPickSortWrap}>
                                        <AnimatedDropdown value={sortBy} onChange={(v) => { setSortBy(v); loadTasks(v); }} options={SORT_OPTIONS} className={styles.taskPickSortDropdown} />
                                    </div>
                                    <div ref={filterWrapRef}>
                                        <TaskFeedFilterPanel
                                            isOpen={isFilterOpen} onToggle={() => setIsFilterOpen(o => !o)}
                                            activeFilterCount={activeFilterCount} activeFilterTab={activeFilterTab} onTabChange={setActiveFilterTab}
                                            filterQuery={filterQuery} onFilterQueryChange={setFilterQuery}
                                            visibleListItems={visibleListItems} filterListIds={filterListIds} onToggleList={toggleList}
                                            groupedVisibleModuleItems={groupedModuleItems} moduleGroupKeys={moduleGroupKeys}
                                            filterModuleCodes={filterModuleCodes} onToggleModule={toggleModule} onClearAll={clearAllFilters}
                                        />
                                    </div>
                                </div>
                                <PrimaryButton variant="primary" pill className={styles.taskPickSmartBtn} onClick={handlePickForMe}>
                                    ✦ Smart Pick — choose a task for me
                                </PrimaryButton>
                            </div>
                            {loading ? (
                                <div className={styles.taskPickLoadingState}>
                                    <div className={styles.taskPickLoadingHeader}>
                                        <SkeletonBlock className={styles.taskPickLoadingTitle} />
                                        <SkeletonBlock className={styles.taskPickLoadingMeta} />
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className={styles.taskPickLoadingRow} />)}
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <SearchEmptyState query={search} itemLabel="tasks" hint={searchLower ? 'Try a different keyword.' : undefined} onClear={searchLower ? () => setSearch('') : undefined} />
                            ) : (
                                <div className={styles.taskPickList}>
                                    {filteredTasks.map(task => (
                                        <TaskPickItem key={task.id} task={task} value={value} recommendedTaskId={recommendedTaskId} onSelect={selectTask} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </StandardModal>
            </div>
        </div>
    );
}
