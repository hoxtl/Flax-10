import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings2, Plus, LayoutList, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
