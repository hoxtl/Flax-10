export function RecurrenceField({ value, onChange }) {
    const { frequency = 'none', interval = 1 } = value || {};
    const onFreqChange = (e) => onChange({ ...value, frequency: e.target.value, interval });
    const onIntChange = (e) => onChange({ ...value, frequency, interval: e.target.value });

    return (
        <div className="form-field">
            <label>Recurrence</label>
            <div style={{ display: 'flex', gap: '10px' }}>
                <RecurrenceSelect frequency={frequency} onChange={onFreqChange} />
                {frequency !== 'none' && <IntervalInput interval={interval} onChange={onIntChange} />}
            </div>
        </div>
    );
}

function RecurrenceSelect({ frequency, onChange }) {
    return (
        <select value={frequency} onChange={onChange} style={{ flex: 1 }}>
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
        </select>
    );
}

function IntervalInput({ interval, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>Every</span>
            <input type="number" min="1" value={interval} onChange={onChange} style={{ width: '60px' }} />
        </div>
    );
}
