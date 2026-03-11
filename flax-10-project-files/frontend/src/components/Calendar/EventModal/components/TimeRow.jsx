import DateTimePicker from '../../../common/inputs/DateTimePicker';
import { getDisplayValue, handleToggle, handleDatePickerChange, handleDateOnlyPickerChange } from './timeRowHelpers';
import './TimeRow.css';

export function TimeRow({ form, update, setForm }) {
    return (
        <div className="time-row-container">
            <AllDayToggle form={form} setForm={setForm} />
            <TimeFields form={form} update={update} />
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

function TimeFields({ form, update }) {
    const isAllDay = form.all_day || false;
    return (
        <div className="form-row">
            <TimeInput label="Start" value={form.start_time} field="start_time" update={update} isAllDay={isAllDay} />
            <TimeInput label="End" value={form.end_time} field="end_time" update={update} isAllDay={isAllDay} />
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
