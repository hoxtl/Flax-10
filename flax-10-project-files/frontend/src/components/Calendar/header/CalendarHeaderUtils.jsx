import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Settings2, Plus, LayoutList, Search, X, FolderKanban, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DatePickerButton } from './DatePickerButton';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import { SegmentedControl } from '../../ui/SegmentedControl';
import AnimatedDropdown from '../../common/AnimatedDropdown';
import SearchBar from '../../common/SearchBar/SearchBar';
import styles from './CalendarHeaderUtils.module.css';

import { deleteSchedule, getSchedules, renameSchedule } from '../../../api/scheduleApi';
import { useToast } from '../../../context/ToastContext';
import StandardModal from '../../common/StandardModal/StandardModal';
import TextInput from '../../common/TextInput/TextInput';
import { useTags } from '../../../context/TagContext';
import TagManagerModal from '../../Tags/TagManagerModal';

export function CalendarNav({ onPrev, onNext, onToday, showToday, selectedDate, onDatePick, title }) {
    return (
        <div className={styles.nav}>
            <NavArrow direction="left" onClick={onPrev} />
            {showToday && <PrimaryButton className={styles.todayBtn} variant="ghost" onClick={onToday} pill>Today</PrimaryButton>}
            <NavArrow direction="right" onClick={onNext} />
            <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
            {title && <h2 className={styles.title}>{title}</h2>}
        </div>
    );
}

function NavArrow({ direction, onClick }) {
    const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
    return <button className={styles.arrowBtn} onClick={onClick}><Icon size={18} /></button>;
}

export function ViewSwitcher({ modes, activeMode, onChange }) {
    return <SegmentedControl options={modes} value={activeMode} onChange={onChange} variant="solid" />;
}

export function ActionMenu({ onAddEvent, onImport }) {
    const options = [
        { label: "Add Event", value: "add" },
        { label: "Import Timetable", value: "import" }
    ];
    return (
        <AnimatedDropdown
            className={styles.actionMenu}
            customTrigger={<button className={styles.actionBtn}><Plus size={18} /></button>}
            options={options}
            hideCheckmark={true}
            onChange={(val) => val === 'add' ? onAddEvent() : onImport()}
            align="right"
        />
    );
}

const DISPLAY_MODE_OPTIONS = [
    { label: "Grid View", value: "grid" },
    { label: "List View", value: "list" },
    { label: "Table View", value: "table" }
];

export function ViewModeButton({ modes, activeMode, onChange }) {
    const trigger = <button className={styles.settingsBtn} title="View Mode"><LayoutList size={18} /></button>;
    return (
        <AnimatedDropdown
            className={styles.actionMenu}
            customTrigger={trigger}
            options={modes}
            value={activeMode}
            onChange={onChange}
            align="right"
        />
    );
}

const MOBILE_DISPLAY_OPTIONS = DISPLAY_MODE_OPTIONS.filter(o => o.value !== 'table');

export function ViewSettingsMenu({ activeMode, onViewChange, isMobile }) {
    const trigger = <button className={styles.settingsBtn} title="Display Mode"><Settings2 size={18} /></button>;
    const options = isMobile ? MOBILE_DISPLAY_OPTIONS : DISPLAY_MODE_OPTIONS;
    return (
        <AnimatedDropdown
            className={styles.actionMenu}
            customTrigger={trigger}
            options={options}
            value={activeMode}
            onChange={onViewChange}
            align="right"
        />
    );
}

function SearchIconButton({ onClick }) {
    return (
        <button className={styles.settingsBtn} onClick={onClick} title="Search events">
            <Search size={18} />
        </button>
    );
}

export function SearchButton({ value, onChange }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef(null);

    const toggle = () => {
        if (isExpanded && value) onChange('');
        setIsExpanded(p => !p);
    };
    const blur = () => { if (!value) setIsExpanded(false); };

    useEffect(() => {
        if (isExpanded) {
            const t = setTimeout(() => inputRef.current?.querySelector?.('input')?.focus(), 120);
            return () => clearTimeout(t);
        }
    }, [isExpanded]);

    return (
        <div className={styles.searchContainer}>
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    <motion.div
                        key="search-expanded"
                        className={styles.searchWrapper}
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div ref={inputRef} className={styles.searchInner}>
                            <SearchBar value={value} onChange={onChange} placeholder="Search events..." className={styles.searchBar} onBlur={blur} />
                            <button className={styles.searchClose} onClick={toggle} aria-label="Close search"><X size={14} /></button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="search-icon"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                    >
                        <SearchIconButton onClick={toggle} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ScheduleCard({
    schedule,
    editingId,
    renameDraft,
    pendingDeleteId,
    isSaving,
    isDeleting,
    onRenameStart,
    onRenameCancel,
    onRenameDraftChange,
    onRenameSave,
    onDeleteToggle,
    onDeleteConfirm,
}) {
    const isEditing = editingId === schedule.id;
    const isPendingDelete = pendingDeleteId === schedule.id;

    return (
        <article className={styles.scheduleCard}>
            <div className={styles.scheduleInfo}>
                {isEditing ? (
                    <TextInput
                        value={renameDraft}
                        onChange={(event) => onRenameDraftChange(event.target.value)}
                        placeholder="Schedule name"
                        aria-label={`Rename ${schedule.title}`}
                    />
                ) : (
                    <h3 className={styles.scheduleCardTitle}>{schedule.title}</h3>
                )}
                <p className={styles.scheduleMeta}>{schedule.event_allocations?.length || 0} allocated events</p>
            </div>

            <div className={styles.scheduleActions}>
                {isEditing ? (
                    <>
                        <PrimaryButton type="button" variant="primary" pill disabled={isSaving} onClick={() => onRenameSave(schedule.id)}>
                            Save
                        </PrimaryButton>
                        <PrimaryButton type="button" variant="ghost" pill onClick={onRenameCancel}>
                            Cancel
                        </PrimaryButton>
                    </>
                ) : (
                    <PrimaryButton type="button" variant="ghost" pill onClick={() => onRenameStart(schedule)}>
                        Rename
                    </PrimaryButton>
                )}

                <PrimaryButton
                    type="button"
                    variant={isPendingDelete ? 'ghost' : 'danger'}
                    pill
                    disabled={isDeleting}
                    onClick={() => (isPendingDelete ? onDeleteConfirm(schedule.id) : onDeleteToggle(schedule.id))}
                >
                    {isPendingDelete ? 'Confirm remove' : 'Remove'}
                </PrimaryButton>
                {isPendingDelete && (
                    <PrimaryButton type="button" variant="ghost" pill onClick={() => onDeleteToggle(null)}>
                        Keep
                    </PrimaryButton>
                )}
            </div>
        </article>
    );
}

function ScheduleManagerDialog({ open, onClose }) {
    const showToast = useToast();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [renameDraft, setRenameDraft] = useState('');
    const [pendingDeleteId, setPendingDeleteId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!open) return;
        let ignore = false;

        const loadSchedules = async () => {
            setLoading(true);
            try {
                const data = await getSchedules();
                if (!ignore) setSchedules(Array.isArray(data) ? data : []);
            } catch (error) {
                if (!ignore) {
                    showToast(error.message, { variant: 'error' });
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        loadSchedules();
        return () => {
            ignore = true;
        };
    }, [open, showToast]);

    useEffect(() => {
        if (!open) {
            setEditingId(null);
            setRenameDraft('');
            setPendingDeleteId(null);
            setIsSaving(false);
            setIsDeleting(false);
        }
    }, [open]);

    const startRename = (schedule) => {
        setPendingDeleteId(null);
        setEditingId(schedule.id);
        setRenameDraft(schedule.title);
    };

    const cancelRename = () => {
        setEditingId(null);
        setRenameDraft('');
    };

    const saveRename = async (scheduleId) => {
        const nextTitle = renameDraft.trim();
        if (!nextTitle) {
            showToast('Please enter a schedule name.', { variant: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const data = await renameSchedule(scheduleId, nextTitle);
            if (data.overwritten) {
                showToast('Existing schedule with that name was replaced.', { variant: 'info' });
            }
            setSchedules((prev) => prev.map((schedule) => (
                schedule.id === scheduleId ? { ...schedule, title: nextTitle, event_allocations: data.event_allocations ?? schedule.event_allocations } : schedule
            )));
            cancelRename();
        } catch (error) {
            showToast(error.message, { variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async (scheduleId) => {
        setIsDeleting(true);
        try {
            await deleteSchedule(scheduleId);
            setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId));
            setPendingDeleteId(null);
        } catch (error) {
            showToast(error.message, { variant: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    if (!open) return null;

    return (
        <StandardModal title="Schedules" subtitle="Rename or remove saved manual and auto-generated schedules." onClose={onClose}>
            <div className={styles.scheduleDialogBody}>
                {loading && <p className={styles.scheduleDialogEmpty}>Loading schedules…</p>}
                {!loading && schedules.length === 0 && (
                    <p className={styles.scheduleDialogEmpty}>No schedules yet. Use Quick Add to create a manual or auto schedule.</p>
                )}
                {!loading && schedules.length > 0 && (
                    <div className={styles.scheduleList}>
                        {schedules.map((schedule) => (
                            <ScheduleCard
                                key={schedule.id}
                                schedule={schedule}
                                editingId={editingId}
                                renameDraft={renameDraft}
                                pendingDeleteId={pendingDeleteId}
                                isSaving={isSaving && editingId === schedule.id}
                                isDeleting={isDeleting && pendingDeleteId === schedule.id}
                                onRenameStart={startRename}
                                onRenameCancel={cancelRename}
                                onRenameDraftChange={setRenameDraft}
                                onRenameSave={saveRename}
                                onDeleteToggle={setPendingDeleteId}
                                onDeleteConfirm={confirmDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </StandardModal>
    );
}

export function ScheduleManagerButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                className={styles.settingsBtn}
                onClick={() => setOpen(true)}
                title="Manage schedules"
                aria-label="Manage schedules"
                type="button"
            >
                <FolderKanban size={18} />
            </button>
            <ScheduleManagerDialog open={open} onClose={() => setOpen(false)} />
        </>
    );
}

export function FilterDropdownButton({ active, onChange }) {
    const { tags } = useTags();
    const [showManager, setShowManager] = useState(false);

    const options = useMemo(() => {
        const uniqueTags = Array.from(
            new Map((tags || []).map(t => [t.label.toLowerCase(), t])).values()
        );
        return [
            { value: "all", label: "All" },
            ...uniqueTags.map(t => ({ value: t.label.toLowerCase(), label: t.label })),
            { value: "__manage__", label: "Manage Tags..." },
        ];
    }, [tags]);

    const handleChange = (val) => {
        if (val === '__manage__') {
            setShowManager(true);
        } else {
            onChange(val);
        }
    };

    const trigger = (
        <button className={styles.settingsBtn} title="Filter events" aria-label="Filter events" type="button">
            <Filter size={18} />
        </button>
    );

    return (
        <>
            <AnimatedDropdown
                className={styles.actionMenu}
                customTrigger={trigger}
                options={options}
                value={active}
                onChange={handleChange}
                align="right"
            />
            {showManager && <TagManagerModal onClose={() => setShowManager(false)} />}
        </>
    );
}
