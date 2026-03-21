/*
 * CalendarHeaderUtils.jsx
 * Utility components for the calendar header.
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings2, Plus, LayoutList, FolderKanban } from 'lucide-react';
import { DatePickerButton } from './DatePickerButton';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import { SegmentedControl } from '../../common';
import AnimatedDropdown from '../../common/AnimatedDropdown';
import { ScheduleManagerDialog } from './ScheduleManager/ScheduleManagerDialog';
import { FilterDropdownButton } from './FilterDropdownButton';
import { SearchButton } from './SearchButton';
import styles from './CalendarHeaderUtils.module.css';

export { FilterDropdownButton, SearchButton };

export function CalendarNav({ onPrev, onNext, onToday, showToday, selectedDate, onDatePick, title }) {
    return (
        <div className={styles.nav}>
            <button className={styles.arrowBtn} onClick={onPrev}><ChevronLeft size={18} /></button>
            {showToday && (
                <PrimaryButton className={styles.todayBtn} variant="ghost" onClick={onToday} pill>
                    Today
                </PrimaryButton>
            )}
            <button className={styles.arrowBtn} onClick={onNext}><ChevronRight size={18} /></button>
            <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
            {title && <h2 className={styles.title}>{title}</h2>}
        </div>
    );
}

export function ViewSwitcher({ modes, activeMode, onChange }) {
    return <SegmentedControl options={modes} value={activeMode} onChange={onChange} variant="solid" />;
}

export function ActionMenu({ onAddEvent, onImport }) {
    const options = [
        { label: "Add Event", value: "add" },
        { label: "Import Timetable", value: "import" }
    ];
    const trigger = <button className={styles.actionBtn}><Plus size={18} /></button>;

    return (
        <AnimatedDropdown
            className={styles.actionMenu}
            customTrigger={trigger}
            options={options}
            hideCheckmark={true}
            onChange={(val) => val === 'add' ? onAddEvent() : onImport()}
            align="right"
            openOnHover
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
            openOnHover
        />
    );
}

export function ViewSettingsMenu({ activeMode, onViewChange, isMobile }) {
    const trigger = <button className={styles.settingsBtn} title="Display Mode"><Settings2 size={18} /></button>;
    const options = isMobile ? DISPLAY_MODE_OPTIONS.filter(o => o.value !== 'table') : DISPLAY_MODE_OPTIONS;
    
    return (
        <AnimatedDropdown
            className={styles.actionMenu}
            customTrigger={trigger}
            options={options}
            value={activeMode}
            onChange={onViewChange}
            align="right"
            openOnHover
        />
    );
}

export function ScheduleManagerButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button className={styles.settingsBtn} onClick={() => setOpen(true)} title="Manage schedules">
                <FolderKanban size={18} />
            </button>
            <ScheduleManagerDialog open={open} onClose={() => setOpen(false)} />
        </>
    );
}
