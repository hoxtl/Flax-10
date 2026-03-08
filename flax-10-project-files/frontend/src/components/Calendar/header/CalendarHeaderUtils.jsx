import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings2, Plus } from 'lucide-react';
import { DatePickerButton } from './DatePickerButton';
import { SegmentedControl } from '../../ui/SegmentedControl';
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
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useClickOutside(ref, () => setOpen(false));
    return (
        <div className={styles.actionMenu} ref={ref}>
            <button className={styles.actionBtn} onClick={() => setOpen(!open)}><Plus size={18} /></button>
            {open && <ActionDropdown onAddEvent={() => { onAddEvent(); setOpen(false); }} onImport={() => { onImport(); setOpen(false); }} />}
        </div>
    );
}

function ActionDropdown({ onAddEvent, onImport }) {
    return (
        <div className={styles.dropdown}>
            <button className={styles.dropdownItem} onClick={onAddEvent}>Add Event</button>
            <button className={styles.dropdownItem} onClick={onImport}>Import Timetable</button>
        </div>
    );
}

export function ViewSettingsButton({ onClick }) {
    return <button className={styles.settingsBtn} onClick={onClick} title="View Settings"><Settings2 size={18} /></button>;
}

function useClickOutside(ref, handler) {
    useEffect(() => {
        const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
        document.addEventListener('mousedown', listener);
        return () => document.removeEventListener('mousedown', listener);
    }, [ref, handler]);
}
