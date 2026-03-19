import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterCheckbox from '../../../common/FilterCheckbox/FilterCheckbox';
import PrimaryButton from '../../../common/PrimaryButton/PrimaryButton';
import './ReminderField.css';

const PRESET_OPTIONS = [
    { value: 0, label: 'At time of event' },
    { value: 5, label: '5 minutes before' },
    { value: 10, label: '10 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 1440, label: '1 day before' },
];

export function ReminderField({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = Array.isArray(value) ? value : [];
    const dropdownRef = useRef(null);

    useClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className="form-field reminder-field" ref={dropdownRef}>
            <label>Reminders</label>
            <DropdownButton selected={selected} onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="reminder-dropdown-panel"
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        <PermissionStatus />
                        <ReminderOptions options={getAllOptions(selected)} selected={selected} onChange={onChange} />
                        <CustomReminderInput selected={selected} onChange={onChange} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function useClickOutside(ref, onClickOutside) {
    useEffect(() => {
        const handler = (e) => ref.current && !ref.current.contains(e.target) && onClickOutside();
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onClickOutside]);
}

function DropdownButton({ selected, onClick, isOpen }) {
    const label = getButtonLabel(selected);
    return (
        <button type="button" className={`reminder-dropdown-btn${isOpen ? ' open' : ''}`} onClick={onClick}>
            <span>{label}</span>
        </button>
    );
}

function getButtonLabel(selected) {
    if (selected.length === 0) return 'No reminders';
    if (selected.length === 1) return formatMinutes(selected[0]);
    return `${selected.length} reminders`;
}

function getAllOptions(selected) {
    const presetValues = PRESET_OPTIONS.map(o => o.value);
    const customValues = selected.filter(v => !presetValues.includes(v));
    const customOptions = customValues.map(v => ({ value: v, label: formatMinutes(v) }));
    return [...PRESET_OPTIONS, ...customOptions].sort((a, b) => a.value - b.value);
}

function PermissionStatus() {
    const [p, setP] = useState(getPermission);
    const request = () => Notification.requestPermission().then(setP);

    if (!('Notification' in window)) return <div className="reminder-status">Not supported</div>;
    if (p === 'granted') return <div className="reminder-status granted">Notifications enabled</div>;
    if (p === 'denied') return <div className="reminder-status denied">Notifications blocked</div>;
    return <button type="button" onClick={request} className="reminder-enable-btn">Enable notifications</button>;
}

function ReminderOptions({ options, selected, onChange }) {
    return (
        <div className="reminder-options-list">
            {options.map(opt => (
                <ReminderCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={selected.includes(opt.value)}
                    onToggle={() => toggleReminder(selected, opt.value, onChange)}
                />
            ))}
        </div>
    );
}

function ReminderCheckbox({ label, checked, onToggle }) {
    return (
        <div className={`reminder-option${checked ? ' active' : ''}`} onClick={onToggle}>
            <FilterCheckbox checked={checked} onChange={onToggle} onClick={e => e.stopPropagation()} />
            <span>{label}</span>
        </div>
    );
}

function CustomReminderInput({ selected, onChange }) {
    const [customValue, setCustomValue] = useState('');
    const onAdd = () => addCustom(customValue, selected, onChange, setCustomValue);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); onAdd(); }
    };

    return (
        <div className="custom-reminder">
            <input
                type="number"
                min="0"
                placeholder="Custom (minutes)"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <PrimaryButton type="button" variant="primary" size="small" pill onClick={onAdd}>Add</PrimaryButton>
        </div>
    );
}

function addCustom(val, selected, onChange, setVal) {
    const minutes = parseInt(val, 10);
    if (isValidCustom(minutes, selected)) {
        onChange([...selected, minutes].sort((a, b) => a - b));
    }
    setVal('');
}

function isValidCustom(minutes, selected) {
    return !isNaN(minutes) && minutes >= 0 && !selected.includes(minutes);
}

function toggleReminder(selected, minutes, onChange) {
    requestPermissionIfNeeded();
    const newValue = selected.includes(minutes)
        ? selected.filter(v => v !== minutes)
        : [...selected, minutes].sort((a, b) => a - b);
    onChange(newValue);
}

function formatMinutes(minutes) {
    if (minutes === 0) return 'At time of event';
    if (minutes < 60) return `${minutes} min before`;
    if (minutes < 1440) return `${minutes / 60} hr before`;
    return `${minutes / 1440} day before`;
}

function getPermission() {
    return ('Notification' in window) ? Notification.permission : 'denied';
}

function requestPermissionIfNeeded() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}
