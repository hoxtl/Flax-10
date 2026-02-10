import { useState } from 'react';

export function ReminderField({ value, onChange }) {
    const isCustom = isCustomValue(value);
    const handleChange = (newVal) => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        onChange(newVal);
    };
    const onSelect = (e) => handleChange(e.target.value === 'custom' ? 1 : parseInt(e.target.value));
    const selectedValue = isCustom ? 'custom' : (value ?? -1);

    return (
        <div className="form-field">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Reminder</label>
                <PermissionButton />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <ReminderSelect value={selectedValue} onChange={onSelect} />
                {isCustom && <CustomReminderInput value={value} onChange={handleChange} />}
            </div>
        </div>
    );
}

function PermissionButton() {
    const [p, setP] = useState(() => ('Notification' in window) ? Notification.permission : 'denied');
    const request = () => Notification.requestPermission().then(setP);

    if (!('Notification' in window)) return <span style={{ fontSize: '12px' }}>Not supported</span>;
    if (p === 'granted') return <span style={{ color: 'green', fontSize: '12px' }}>✓ Enabled</span>;
    if (p === 'denied') return <span style={{ color: 'red', fontSize: '12px' }}>Blocked</span>;
    return <button type="button" onClick={request} style={{ fontSize: '12px' }}>Enable Alerts</button>;
}

function ReminderSelect({ value, onChange }) {
    return (
        <select value={value} onChange={onChange} style={{ flex: 1 }}>
            <option value={-1}>None</option>
            <option value={0}>At time of event</option>
            <option value={5}>5 minutes before</option>
            <option value={10}>10 minutes before</option>
            <option value={15}>15 minutes before</option>
            <option value={30}>30 minutes before</option>
            <option value={60}>1 hour before</option>
            <option value={120}>2 hours before</option>
            <option value={1440}>1 day before</option>
            <option value="custom">Custom...</option>
        </select>
    );
}

function CustomReminderInput({ value, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <input
                type="number" min="0" value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                style={{ width: '60px' }}
            />
            <span>minutes</span>
        </div>
    );
}

function isCustomValue(v) {
    const standards = [-1, 0, 5, 10, 15, 30, 60, 120, 1440];
    return v !== null && v !== undefined && !standards.includes(v);
}
