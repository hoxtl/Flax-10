import { FormField } from './FormField';
import { getType, handleDateChange, getDisplayValue, handleToggle } from './timeRowHelpers';
import DateTimePicker from '../../../../pages/Tasks/components/DateTimePicker';
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
                <input
                    type="checkbox"
                    checked={form.all_day || false}
                    onChange={handleToggle(setForm, form)}
                />
                <span className="slider"></span>
            </label>
        </div>
    );
}

function TimeFields({ form, update }) {
    const isAllDay = form.all_day || false;
    const type = getType(isAllDay);
    const fields = [
        { label: 'Start', value: form.start_time, field: 'start_time' },
        { label: 'End', value: form.end_time, field: 'end_time' }
    ];
    return (
        <div className="form-row">
            {fields.map(f => (
                <TimeInput key={f.field} {...f} update={update} type={type} isAllDay={isAllDay} />
            ))}
        </div>
    );
}

function TimeInput({ label, value, field, update, type, isAllDay }) {
    if (!isAllDay && type === 'datetime-local') {
        return (
            <div className="form-field">
                <label>{label}</label>
                <DateTimePicker
                    value={value || ''}
                    onChange={(iso) => update(field)({ target: { value: iso || '' } })}
                    placeholder={label === 'Start' ? 'Pick start date & time' : 'Pick end date & time'}
                />
            </div>
        );
    }
    return (
        <FormField
            label={label}
            type={type}
            value={getDisplayValue(value, isAllDay, field) || ''}
            onChange={handleDateChange(field, isAllDay, update)}
            required
        />
    );
}
