import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FilterCheckbox from '../../../common/filter_checkbox/FilterCheckbox';
import './reminder-field.css';
import { CustomReminderInput, PermissionStatus, useReminderOutsideClick } from './ReminderFieldParts';
const PRESET = [
    { value: 0, label: 'At time of event' }, { value: 5, label: '5 min before' },
    { value: 10, label: '10 min before' }, { value: 15, label: '15 min before' },
    { value: 30, label: '30 min before' }, { value: 60, label: '1 hr before' },
    { value: 1440, label: '1 day before' },
];
function Panel({ selected, onChange }) {
    const opts = [...PRESET, ...selected.filter(v => !PRESET.map(o => o.value).includes(v)).map(v => ({ value: v, label: formatMinutes(v) }))].sort((a, b) => a.value - b.value);
    return (
        <motion.div className="reminder-dropdown-panel" initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}>
            <PermissionStatus />
            <div className="reminder-options-list">
                {opts.map(o => <div key={o.value} className={`reminder-option${selected.includes(o.value) ? ' active' : ''}`} onClick={() => toggleReminder(selected, o.value, onChange)}><FilterCheckbox checked={selected.includes(o.value)} onChange={() => {}} /><span>{o.label}</span></div>)}
            </div>
            <CustomReminderInput selected={selected} onChange={onChange} />
        </motion.div>
    );
}
export function ReminderField({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const selected = Array.isArray(value) ? value : [];
    const ref = useRef(null);
    useReminderOutsideClick(ref, () => setOpen(false));
    const label = selected.length === 0 ? 'No reminders' : selected.length === 1 ? formatMinutes(selected[0]) : `${selected.length} reminders`;
    return (
        <div className="form-field reminder-field" ref={ref}><label>Reminders</label>
            <button type="button" className={`reminder-dropdown-btn${open ? ' open' : ''}`} onClick={() => setOpen(!open)}><span>{label}</span></button>
            <AnimatePresence>{open && <Panel selected={selected} onChange={onChange} />}</AnimatePresence>
        </div>
    );
}
function toggleReminder(selected, m, onChange) {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    onChange(selected.includes(m) ? selected.filter(v => v !== m) : [...selected, m].sort((a, b) => a - b));
}
function formatMinutes(m) {
    if (m === 0) return 'At time of event';
    if (m < 60) return `${m} min before`;
    if (m < 1440) return `${m / 60} hr before`;
    return `${m / 1440} day before`;
}
