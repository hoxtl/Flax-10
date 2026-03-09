import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings2, Plus } from 'lucide-react';
import { DatePickerButton } from './DatePickerButton';
import { SegmentedControl } from '../../ui/SegmentedControl';
import AnimatedDropdown from '../../ui/AnimatedDropdown';
import styles from './CalendarHeaderUtils.module.css';

export function CalendarNav({ onPrev, onNext, onToday, showToday, selectedDate, onDatePick, title }) {
    return (
        <div className={styles.nav}>
            <NavArrow direction="left" onClick={onPrev} />
            {showToday && <button className={styles.todayBtn} onClick={onToday}>Today</button>}
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
    return <SegmentedControl options={modes} value={activeMode} onChange={onChange} />;
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
        />
    );
}

export function ViewSettingsMenu({ isMobile, modes, activeMode, onViewChange }) {
    if (!isMobile) {
        return <button className={styles.settingsBtn} title="View Settings"><Settings2 size={18} /></button>;
    }

    return (
        <AnimatedDropdown
            className={styles.actionMenu}
            customTrigger={<button className={styles.settingsBtn} title="View Settings"><Settings2 size={18} /></button>}
            options={modes}
            value={activeMode}
            onChange={onViewChange}
        />
    );
}
