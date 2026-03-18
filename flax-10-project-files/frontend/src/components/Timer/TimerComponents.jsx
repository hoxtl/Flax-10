import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from "../../pages/Timer/TimerPage.module.css";
import SearchBar from '../common/SearchBar/SearchBar';
import SearchEmptyState from '../common/SearchEmptyState/SearchEmptyState';
import SkeletonBlock from "../common/LoadingState/SkeletonBlock";
import { noiseGenerator } from './utils/noiseUtils';
import { FOCUS_BLOCK_COLOURS_HEX } from '../../pages/Tasks/constants/focusBlockColours';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import StandardModal from '../common/StandardModal/StandardModal';
import AnimatedDropdown from '../common/AnimatedDropdown';
import TaskFeedFilterPanel from '../../pages/Tasks/components/TaskFeedFilterPanel';
import { isEnrolledIn } from '../Modules/utils/moduleUtils';
import {
    compareTaskPriority,
    compareTaskDue,
    compareTaskEstimatedTime,
    getTaskDurationMinutes,
} from '../../lib/focusPlanner';

/** Formats seconds to MM:SS */
export const formatTime = (seconds) => {
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60).toString().padStart(2, '0');
    const s = (abs % 60).toString().padStart(2, '0');
    return `${seconds < 0 ? '+' : ''}${m}:${s}`;
};

export const TimerDisplay = ({ timeLeft, mode, isOvertime }) => {
    const className = `${styles.timerDisplay} ${mode === 'break' ? styles.break : ''} ${isOvertime ? styles.overtime : ''}`;
    return <div className={className}>{formatTime(timeLeft)}</div>;
};

const getModeText = (mode, isOvertime, isBreakOvertime) => {
    if (mode === 'work') return isOvertime ? '🚀 Overtime' : '🔥 Focus Time';
    return isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time';
};

export const ModeIndicator = ({ mode, isOvertime, isBreakOvertime }) => (
    <div className={`${styles.modeIndicator} ${mode === 'break' ? styles.break : ''}`}>
        {getModeText(mode, isOvertime, isBreakOvertime)}
    </div>
);

export const SessionStatus = ({ current, total }) => (
    <div className={styles.sessionStatus}>Session {current + 1} of {total}</div>
);

const PauseIndicator = ({ isPaused, totalPaused }) => {
    if (!isPaused || totalPaused <= 0) return null;
    return <div className={styles.pauseIndicator}>Paused: {formatTime(totalPaused)}</div>;
};

const PrimaryTimerBtn = ({ isActive, isPaused, onToggle, onPause }) => {
    const label = !isActive ? 'Start' : (isPaused ? 'Resume' : 'Pause');
    const action = !isActive ? onToggle : onPause;
    return <button className={`${styles.button} ${styles.primary}`} onClick={action}>{label}</button>;
};

export const TimerControls = ({ isActive, isPaused, onToggle, onPause, onReset, onEndEarly, totalPaused }) => {
    const pInd = <PauseIndicator isPaused={isPaused} totalPaused={totalPaused} />;
    const pBtn = <PrimaryTimerBtn isActive={isActive} isPaused={isPaused} onToggle={onToggle} onPause={onPause} />;
    const rBtn = <button className={`${styles.button} ${styles.danger}`} onClick={onReset}>Reset</button>;
    const eBtn = <button className={`${styles.button} ${styles.danger} ${styles.outline}`} onClick={onEndEarly}>End Early</button>;
    const actns = isActive || isPaused ? <>{pBtn}{rBtn}{eBtn}</> : <>{pBtn}</>;
    return <div className={styles.controls}>{pInd}<div className={styles.buttonGroup}>{actns}</div></div>;
};

// Helpers for useBufferedInput
const handleInput = (e, min, setLocal, onError) => {
    const num = parseInt(e.target.value);
    const isMin = !isNaN(num) && num < min;
    setLocal(isMin ? min : e.target.value);
    if (onError) onError(isMin);
};

const commitInput = (local, value, min, setLocal, onUpdate, onError) => {
    const final = Math.max(parseInt(local) || min, min);
    setLocal(final);
    if (final !== value) onUpdate(final);
    if (onError) onError(false);
};

const handleArrowDown = (e, local, min, onError) => {
    if (local !== '' && parseInt(local) > min) return;
    e.preventDefault();
    if (onError) onError(true);
};

const handleKey = (e, local, min, onError) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'ArrowDown') handleArrowDown(e, local, min, onError);
};

const useBufferedInput = (value, onUpdate, min, onError) => {
    const [local, setLocal] = useState(value);
    useEffect(() => setLocal(value), [value]);

    const onChange = (e) => handleInput(e, min, setLocal, onError);
    const onBlur = () => commitInput(local, value, min, setLocal, onUpdate, onError);
    const onKeyDown = (e) => handleKey(e, local, min, onError);

    return { local, onChange, onBlur, onKeyDown };
};

const BufferedInput = ({ label, value, ...props }) => {
    const { local, onChange, onBlur, onKeyDown } = useBufferedInput(value, props.onUpdate, props.min, props.onError);
    const lbl = <label className={styles.label}>{label}</label>;
    const inp = <input type="number" className={styles.input} value={local} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} onFocus={(e) => e.target.select()} />;
    return <div className={styles.settingItem}>{lbl}{inp}</div>;
};

const Disclaimer = ({ show }) => {
    if (!show) return null;
    const style = { marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7, color: '#ef4444' };
    return <div className={styles.disclaimer} style={style}>* Minimum study time is 1 minute</div>;
};

const SettingsInputs = ({ work, breakTime, sessions, onUpdate, setShowError }) => {
    const wInp = <BufferedInput label="Work (min)" value={work} min={1} onUpdate={(v) => onUpdate('work', v)} onError={setShowError} />;
    const bInp = <BufferedInput label="Break (min)" value={breakTime} min={0} onUpdate={(v) => onUpdate('break', v)} />;
    const sInp = <BufferedInput label="Sessions" value={sessions} min={1} onUpdate={(v) => onUpdate('sessions', v)} />;
    return <div className={styles.settings}>{wInp}{bInp}{sInp}</div>;
};

export const TimerSettings = ({ work, breakTime, sessions, onUpdate }) => {
    const [showError, setShowError] = useState(false);
    const inputs = <SettingsInputs work={work} breakTime={breakTime} sessions={sessions} onUpdate={onUpdate} setShowError={setShowError} />;
    const disc = <Disclaimer show={showError} />;
    return <div className={styles.settingsContainer}>{inputs}{disc}</div>;
};

const applyNoise = (noiseType, volume) => {
    if (noiseType === 'none') return noiseGenerator.stop();
    noiseGenerator.play(noiseType);
    noiseGenerator.setVolume(volume);
};

export const useAmbientSound = () => {
    const [noiseType, setNoiseType] = useState('none');
    const [volume, setVolume] = useState(0.5);
    useEffect(() => {
        applyNoise(noiseType, volume);
        return () => noiseGenerator.stop();
    }, [noiseType, volume]);
    const toggle = (value) => setNoiseType((prev) => prev === value ? 'none' : value);
    return { noiseType, toggle, volume, setVolume };
};

// Keep SoundSelector for backward compat but it's now unused in the timer
export const SoundSelector = () => null;

const handleTaskKey = (e) => {
    if (e.key === 'Enter') e.target.blur();
};

/** Task input with optional pick-from-tasks list (sort by urgency/due/time, filter by list/module) */
const SORT_URGENCY = 'urgency';
const SORT_TIME = 'time';
const SORT_DUE = 'due';
const SORT_ALPHA = 'alpha';
const SORT_DATE_ADDED = 'date_added';

const SORT_OPTIONS = [
    { value: SORT_URGENCY, label: 'Urgency' },
    { value: SORT_DUE, label: 'Due date' },
    { value: SORT_ALPHA, label: 'A → Z' },
    { value: SORT_DATE_ADDED, label: 'Date added' },
    { value: SORT_TIME, label: 'Estimated time' },
];

const URGENCY_COLOURS = {
    hot: '#d16a6a',
    warm: '#c6a06a',
    cool: '#8ea0b6',
};

const getTaskUrgencyTone = (task) => {
    const raw = task?.due_date || task?.dueDate;
    if (!raw) return 'cool';
    const due = new Date(raw);
    if (Number.isNaN(due.getTime())) return 'cool';

    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    if (due.getTime() <= endOfToday.getTime()) return 'hot';
    const diffHours = (due.getTime() - now.getTime()) / 3600000;
    if (diffHours <= 48) return 'warm';
    return 'cool';
};

const normalizeModuleCode = (code) => String(code || '').trim().toUpperCase();

const urgencyRank = (task) => {
    const tone = getTaskUrgencyTone(task);
    if (tone === 'hot') return 0;
    if (tone === 'warm') return 1;
    return 2;
};

export const TaskInput = ({ value, onChange, onClearTask, onTaskSelect, onJustStart, isSessionActive = false, onOpenFocus }) => {
    const [open, setOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState(SORT_URGENCY);
    const [search, setSearch] = useState('');
    const [recommendedTaskId, setRecommendedTaskId] = useState(null);
    const ref = useRef(null);

    const [filterListIds, setFilterListIds] = useState([]);
    const [filterModuleCodes, setFilterModuleCodes] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('lists');
    const [filterQuery, setFilterQuery] = useState('');
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
                const listArr = listsData || [];
                listArr.forEach((list, idx) => {
                    listMap[String(list.id)] = {
                        name: list.name || 'Other',
                        color: list.color || FOCUS_BLOCK_COLOURS_HEX[idx % FOCUS_BLOCK_COLOURS_HEX.length],
                    };
                });
                setLists(listArr);
                let list = (tasksData || []).filter((t) => !t.completed).map((t) => {
                    const listInfo = listMap[String(t.task_list)] || { name: 'Other', color: '#94a3b8' };
                    return { ...t, list_name: listInfo.name, list_color: listInfo.color };
                });
                if (sort === SORT_TIME) {
                    list.sort(compareTaskEstimatedTime);
                } else if (sort === SORT_DUE) {
                    list.sort(compareTaskDue);
                } else if (sort === SORT_ALPHA) {
                    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                } else if (sort === SORT_DATE_ADDED) {
                    list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
                } else {
                    list.sort(compareTaskPriority);
                }
                setTasks(list.slice(0, 100));
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

    const handleOpen = () => {
        if (!open) loadTasks();
        setOpen((o) => !o);
    };

    const selectTask = (task) => {
        onChange(task.title);
        setOpen(false);
        onTaskSelect?.(task);
    };
    const handleClearTask = () => {
        onChange('');
        onClearTask?.();
        setRecommendedTaskId(null);
    };
    const isCompact = Boolean(isSessionActive && value);
    const hasTaskValue = Boolean((value || '').trim());

    const searchLower = (search || '').toLowerCase().trim();

    const moduleCodePrefix = (code = '') => code.match(/^[A-Za-z]+/)?.[0]?.toUpperCase() || 'Other';

    const [enrolledModules, setEnrolledModules] = useState([]);
    useEffect(() => {
        let active = true;
        import('../../api/moduleApi').then(({ getModules, getEnrollments }) => {
            Promise.all([getModules(), getEnrollments()])
                .then(([allMods, enrollments]) => {
                    if (!active) return;
                    const enrolled = (allMods || []).filter((m) => isEnrolledIn(m.id, enrollments || []));
                    const mapped = enrolled.map((m) => ({
                        code: normalizeModuleCode(m.module_code),
                        name: String(m.module_name || m.title || '').trim(),
                    })).filter((m) => m.code);
                    setEnrolledModules(mapped);
                })
                .catch(() => {});
        });
        return () => { active = false; };
    }, []);

    const listItems = useMemo(() => (lists || []).map((l) => ({ value: String(l.id), label: l.name || 'List' })), [lists]);

    const moduleItems = useMemo(() => {
        const byCode = new Map();
        enrolledModules.forEach((m) => { if (m.code) byCode.set(m.code, m.name); });
        tasks.forEach((t) => {
            const code = normalizeModuleCode(t.module_code);
            if (!code || byCode.has(code)) return;
            const name = String(t.module_name || '').trim();
            byCode.set(code, name);
        });
        return Array.from(byCode.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([code, name]) => ({
            value: code,
            label: name ? `${code} — ${name}` : code,
        }));
    }, [enrolledModules, tasks]);

    const visibleListItems = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        return !q ? listItems : listItems.filter((o) => o.label.toLowerCase().includes(q));
    }, [listItems, filterQuery]);

    const groupedModuleItems = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        const base = !q ? moduleItems : moduleItems.filter((o) => o.label.toLowerCase().includes(q));
        return base.reduce((acc, item) => {
            const k = moduleCodePrefix(item.value);
            if (!acc[k]) acc[k] = [];
            acc[k].push(item);
            return acc;
        }, {});
    }, [moduleItems, filterQuery]);

    const moduleGroupKeys = useMemo(() => Object.keys(groupedModuleItems).sort(), [groupedModuleItems]);

    const toggleList = (listId) => {
        setFilterListIds((prev) => {
            const str = String(listId);
            return prev.includes(str) ? prev.filter((id) => id !== str) : [...prev, str];
        });
    };
    const toggleModule = (code) => {
        setFilterModuleCodes((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
    };
    const clearAllFilters = () => { setFilterListIds([]); setFilterModuleCodes([]); setFilterQuery(''); };
    const activeFilterCount = filterListIds.length + filterModuleCodes.length;

    let filteredTasks = searchLower
        ? tasks.filter((t) => (t.title || '').toLowerCase().includes(searchLower) || (t.list_name || '').toLowerCase().includes(searchLower) || ((t.module_code || '').toLowerCase().includes(searchLower)))
        : tasks;

    if (filterListIds.length > 0) {
        const set = new Set(filterListIds.map(String));
        filteredTasks = filteredTasks.filter((t) => set.has(String(t.task_list)));
    }
    if (filterModuleCodes.length > 0) {
        const set = new Set(filterModuleCodes);
        filteredTasks = filteredTasks.filter((t) => set.has(normalizeModuleCode(t.module_code)));
    }
    const recommendedTask = useMemo(() => {
        if (!filteredTasks.length) return null;
        return [...filteredTasks].sort((a, b) => {
            const rankDiff = urgencyRank(a) - urgencyRank(b);
            if (rankDiff !== 0) return rankDiff;
            return compareTaskDue(a, b);
        })[0] || null;
    }, [filteredTasks]);

    const handlePickForMe = () => {
        if (!recommendedTask) return;
        setRecommendedTaskId(recommendedTask.id);
        window.setTimeout(() => {
            selectTask(recommendedTask);
        }, 140);
    };

    return (
        <div className={styles.taskInputWrap}>
            {value && !isCompact && (
                <div className={styles.currentTaskLabel}>Currently focusing on:</div>
            )}
            <div className={styles.taskInputContainer} ref={ref}>
                <input
                    type="text"
                    className={`${styles.taskInput} ${value ? styles.taskInputHasValue : ''} ${isCompact ? styles.taskInputCompact : ''}`}
                    placeholder={isCompact ? "Task in progress" : "What are you working on? 🎯"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleTaskKey}
                />
                {!isCompact ? (
                    <div className={styles.taskInputActions}>
                        <div className={styles.taskInputActionsRow}>
                            <PrimaryButton
                                variant="primary"
                                pill
                                className={styles.taskPickBtn}
                                onClick={handleOpen}
                                title="Select a task"
                            >
                                Choose a task to focus
                            </PrimaryButton>
                            {typeof onOpenFocus === 'function' && (
                                <PrimaryButton
                                    variant="secondary"
                                    pill
                                    className={styles.fullFocusInlineBtn}
                                    onClick={onOpenFocus}
                                >
                                    Full Focus Mode ⚡
                                </PrimaryButton>
                            )}
                        </div>
                        {hasTaskValue ? (
                            <button
                                type="button"
                                className={styles.taskClearBtn}
                                onClick={handleClearTask}
                                title="Clear selected task"
                            >
                                Clear task
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className={`${styles.taskInputActions} ${styles.taskInputActionsCompact}`}>
                        <button
                            type="button"
                            className={styles.taskPickBtn}
                            onClick={handleOpen}
                            title="Change task"
                        >
                            Change task
                        </button>
                        {hasTaskValue ? (
                            <button
                                type="button"
                                className={styles.taskClearBtn}
                                onClick={handleClearTask}
                                title="Clear selected task"
                            >
                                Clear task
                            </button>
                        ) : null}
                    </div>
                )}
                <StandardModal
                    onClose={() => setOpen(false)}
                    size="md"
                    hideHeader
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
                                <button
                                    type="button"
                                    className={styles.taskPickCloseBtn}
                                    onClick={() => setOpen(false)}
                                    aria-label="Close task picker"
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.taskPickFiltersBar}>
                                <div className={styles.taskPickToolbarRow}>
                                    <SearchBar
                                        value={search}
                                        onChange={setSearch}
                                        placeholder="Search tasks…"
                                        className={styles.taskPickSearch}
                                    />
                                    <div className={styles.taskPickSortWrap}>
                                        <AnimatedDropdown
                                            value={sortBy}
                                            onChange={(v) => { setSortBy(v); loadTasks(v); }}
                                            options={SORT_OPTIONS}
                                            className={styles.taskPickSortDropdown}
                                        />
                                    </div>
                                    <div ref={filterWrapRef}>
                                        <TaskFeedFilterPanel
                                            isOpen={isFilterOpen}
                                            onToggle={() => setIsFilterOpen((o) => !o)}
                                            activeFilterCount={activeFilterCount}
                                            activeFilterTab={activeFilterTab}
                                            onTabChange={setActiveFilterTab}
                                            filterQuery={filterQuery}
                                            onFilterQueryChange={setFilterQuery}
                                            visibleListItems={visibleListItems}
                                            filterListIds={filterListIds}
                                            onToggleList={toggleList}
                                            groupedVisibleModuleItems={groupedModuleItems}
                                            moduleGroupKeys={moduleGroupKeys}
                                            filterModuleCodes={filterModuleCodes}
                                            onToggleModule={toggleModule}
                                            onClearAll={clearAllFilters}
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
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <SkeletonBlock key={index} className={styles.taskPickLoadingRow} />
                                    ))}
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <SearchEmptyState
                                    query={search}
                                    itemLabel="tasks"
                                    hint={searchLower ? 'Try a different keyword.' : undefined}
                                    onClear={searchLower ? () => setSearch('') : undefined}
                                />
                            ) : (
                                <div className={styles.taskPickList}>
                                    {filteredTasks.map((task) => {
                                        const durationMinutes = getTaskDurationMinutes(task);
                                        const listName = task.list_name || 'Other';
                                        const urgencyTone = getTaskUrgencyTone(task);
                                        const isSelected = value === task.title;
                                        const isRecommended = recommendedTaskId === task.id;
                                        const urgencyClass = urgencyTone === 'hot'
                                            ? styles.taskPickItemHot
                                            : urgencyTone === 'warm'
                                                ? styles.taskPickItemWarm
                                                : styles.taskPickItemCool;
                                        const taskMarker = urgencyTone === 'hot'
                                            ? '🔥'
                                            : task.module_code
                                                ? '🦁'
                                                : null;
                                        const moduleOrList = task.module_code || listName;
                                        return (
                                            <button
                                                key={task.id}
                                                type="button"
                                                className={`${styles.taskPickItem} ${urgencyClass} ${isSelected ? styles.taskPickItemSelected : ''} ${isRecommended ? styles.taskPickItemRecommended : ''}`}
                                                onClick={() => selectTask(task)}
                                                title={task.title}
                                            >
                                                <div className={styles.taskPickItemContent}>
                                                    <span className={styles.taskPickSingleLine}>
                                                        <span className={styles.taskPickTitleRow}>
                                                            {taskMarker ? <span className={styles.taskPickPriorityIcon}>{taskMarker}</span> : null}
                                                            <span className={styles.taskPickTitle}>{task.title}</span>
                                                        </span>
                                                        <span className={styles.taskPickInlineMeta}>
                                                            <span className={styles.taskPickDurationInline}>{durationMinutes} mins</span>
                                                            <span className={styles.taskPickMetaDivider}>•</span>
                                                            <span className={styles.taskPickMetaLine}>{moduleOrList}</span>
                                                        </span>
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </StandardModal>
            </div>
        </div>
    );
};
