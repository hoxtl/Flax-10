import DateTimePicker from '../../../Common/inputs/DateTimePicker';
import AnimatedDropdown from '../../../Common/AnimatedDropdown';
import { getDisplayValue, handleToggle, handleDatePickerChange, handleDateOnlyPickerChange } from './timeRowHelpers';
import './TimeRow.css';

const FREQUENCY_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
];

export function TimeRow({ form, update, setForm, recurrenceValue, onRecurrenceChange }) {
    return (
        <div className="time-row-container">
            <AllDayToggle form={form} setForm={setForm} />
            <TimeFields form={form} update={update} recurrenceValue={recurrenceValue} onRecurrenceChange={onRecurrenceChange} />
        </div>
    );
}

function AllDayToggle({ form, setForm }) {
    return (
        <div className="all-day-toggle-row">
            <span className="toggle-label">All-day</span>
            <label className="switch">
                <input type="checkbox" checked={form.all_day || false} onChange={handleToggle(setForm, form)} />
                <span className="slider"></span>
            </label>
        </div>
    );
}

function TimeFields({ form, update, recurrenceValue, onRecurrenceChange }) {
    const isAllDay = form.all_day || false;
    const frequency = recurrenceValue?.frequency || 'none';
    const handleFrequencyChange = (val) => onRecurrenceChange?.({ ...recurrenceValue, frequency: val });
    return (
        <div className="form-row-3">
            <TimeInput label="Start" value={form.start_time} field="start_time" update={update} isAllDay={isAllDay} />
            <TimeInput label="End" value={form.end_time} field="end_time" update={update} isAllDay={isAllDay} />
            <div className="form-field">
                <label>Repeat</label>
                <AnimatedDropdown value={frequency} onChange={handleFrequencyChange} options={FREQUENCY_OPTIONS} placeholder="None" />
            </div>
        </div>
    );
}

function TimeInput({ label, value, field, update, isAllDay }) {
    if (isAllDay) return <DateOnlyInput label={label} value={value} field={field} update={update} />;
    return <DateTimeInput label={label} value={value} field={field} update={update} />;
}

function DateTimeInput({ label, value, field, update }) {
    return (
        <div className="form-field">
            <label>{label}</label>
            <DateTimePicker value={value || ''} onChange={handleDatePickerChange(field, update)} placeholder={`Select ${label.toLowerCase()}`} />
        </div>
    );
}

function DateOnlyInput({ label, value, field, update }) {
    return (
        <div className="form-field">
            <label>{label}</label>
            <DateTimePicker
                value={getDisplayValue(value, true, field) || ''}
                onChange={handleDateOnlyPickerChange(field, update)}
                dateOnly={true}
                placeholder={`Select ${label.toLowerCase()}`}
            />
        </div>
    );
}
