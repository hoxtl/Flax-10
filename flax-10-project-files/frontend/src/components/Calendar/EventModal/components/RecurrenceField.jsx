import './RecurrenceField.css';

export function RecurrenceField({ value, onChange }) {
    const { frequency = 'none', interval = 1, end_date = null } = value || {};
    const hasRecurrence = frequency !== 'none';

    const updateField = (field, val) => onChange({ ...value, frequency, interval, end_date, [field]: val });

    return (
        <div className="form-field recurrence-field">
            <label>Repeat</label>
            <RecurrenceOptions frequency={frequency} interval={interval} onChange={updateField} />
            {hasRecurrence && <EndRepeatField endDate={end_date} onChange={updateField} />}
        </div>
    );
}

function RecurrenceOptions({ frequency, interval, onChange }) {
    return (
        <div className="recurrence-row">
            <FrequencySelect frequency={frequency} onChange={(e) => onChange('frequency', e.target.value)} />
            {frequency !== 'none' && <IntervalInput interval={interval} onChange={onChange} />}
        </div>
    );
}

function FrequencySelect({ frequency, onChange }) {
    return (
        <select value={frequency} onChange={onChange} className="frequency-select">
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
        </select>
    );
}

function IntervalInput({ interval, onChange }) {
    return (
        <div className="interval-input">
            <span>Every</span>
            <input type="number" min="1" value={interval} onChange={(e) => onChange('interval', e.target.value)} />
        </div>
    );
}

function EndRepeatField({ endDate, onChange }) {
    const endType = endDate ? 'on_date' : 'never';

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        onChange('end_date', newType === 'never' ? null : getDefaultEndDate());
    };

    return (
        <div className="end-repeat-section">
            <label>End repeat</label>
            <EndRepeatOptions endType={endType} endDate={endDate} onTypeChange={handleTypeChange} onChange={onChange} />
        </div>
    );
}

function EndRepeatOptions({ endType, endDate, onTypeChange, onChange }) {
    return (
        <div className="end-repeat-row">
            <select value={endType} onChange={onTypeChange} className="end-type-select">
                <option value="never">Never</option>
                <option value="on_date">On date</option>
            </select>
            {endType === 'on_date' && <DateInput endDate={endDate} onChange={onChange} />}
        </div>
    );
}

function DateInput({ endDate, onChange }) {
    return (
        <input
            type="date"
            value={endDate}
            onChange={(e) => onChange('end_date', e.target.value || null)}
            className="end-date-input"
        />
    );
}

function getDefaultEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
}
