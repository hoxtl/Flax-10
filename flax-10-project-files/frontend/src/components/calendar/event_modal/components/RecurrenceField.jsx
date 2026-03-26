import DateTimePicker from '../../../common/inputs/DateTimePicker';
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Calendar/event_modal/components/RecurrenceField.jsx
import AnimatedDropdown from '../../../common/animated_dropdown';
import './recurrence-field.css';
=======
import AnimatedDropdown from '../../../common/AnimatedDropdown';
import './RecurrenceField.css';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Calendar/EventModal/components/RecurrenceField.jsx

const FREQUENCY_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

const END_TYPE_OPTIONS = [
    { value: 'never', label: 'Never' },
    { value: 'on_date', label: 'On date' },
];

export function RecurrenceField({ value, onChange, hideFrequency = false }) {
    const { frequency = 'none', interval = 1, end_date = null } = value || {};
    const hasRecurrence = frequency !== 'none';

    const updateField = (field, val) => onChange({ ...value, frequency, interval, end_date, [field]: val });

    if (hideFrequency && !hasRecurrence) return null;

    return (
        <div className="form-field recurrence-field">
            {!hideFrequency && <label>Repeat</label>}
            {!hideFrequency && <RecurrenceOptions frequency={frequency} interval={interval} onChange={updateField} />}
            {hasRecurrence && <IntervalInput interval={interval} onChange={updateField} />}
            {hasRecurrence && <EndRepeatField endDate={end_date} onChange={updateField} />}
        </div>
    );
}

function RecurrenceOptions({ frequency, interval, onChange }) {
    return (
        <div className="recurrence-row">
            <div className="frequency-dropdown">
                <AnimatedDropdown value={frequency} onChange={(val) => onChange('frequency', val)} options={FREQUENCY_OPTIONS} placeholder="Select" />
            </div>
            {frequency !== 'none' && <IntervalInput interval={interval} onChange={onChange} />}
        </div>
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
    const handleTypeChange = (val) => onChange('end_date', val === 'never' ? null : getDefaultEndDate());

    return (
        <div className="end-repeat-section">
            <label>End repeat</label>
            <div className="end-repeat-row">
                <div className="end-type-dropdown">
                    <AnimatedDropdown value={endType} onChange={handleTypeChange} options={END_TYPE_OPTIONS} placeholder="Select" />
                </div>
                {endType === 'on_date' && <DateInput endDate={endDate} onChange={onChange} />}
            </div>
        </div>
    );
}

function DateInput({ endDate, onChange }) {
    return (
        <DateTimePicker
            value={endDate}
            onChange={(val) => onChange('end_date', val || null)}
            dateOnly
            placeholder="Select end date"
        />
    );
}

function getDefaultEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
}
