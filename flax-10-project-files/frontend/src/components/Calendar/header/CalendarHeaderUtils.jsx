import { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings2, Plus, LayoutList, Search, X } from 'lucide-react';
import { DatePickerButton } from './DatePickerButton';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import { SegmentedControl } from '../../ui/SegmentedControl';
import AnimatedDropdown from '../../common/AnimatedDropdown';
import SearchBar from '../../common/SearchBar/SearchBar';
import styles from './CalendarHeaderUtils.module.css';

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

function SearchExpanded({ value, onChange, onClose, onBlur }) {
    return (
        <div className={styles.searchWrapper}>
            <SearchBar value={value} onChange={onChange} placeholder="Search events..." className={styles.searchBar} onBlur={onBlur} />
            <button className={styles.searchClose} onClick={onClose}><X size={16} /></button>
        </div>
    );
}

export function SearchButton({ value, onChange }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggle = () => { if (isExpanded && value) onChange(''); setIsExpanded(p => !p); };
    const blur = () => { if (!value) setIsExpanded(false); };

    if (!isExpanded) return <SearchIconButton onClick={toggle} />;
    return <SearchExpanded value={value} onChange={onChange} onClose={toggle} onBlur={blur} />;
}
