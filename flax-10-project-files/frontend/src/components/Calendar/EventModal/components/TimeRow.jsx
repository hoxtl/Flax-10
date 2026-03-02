import { handleToggle } from './timeRowHelpers';
import DateTimePicker from './DateTimePicker';
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

    if (isAllDay) {
        return (
            <div className="form-row">
                <AllDayDateInput label="Start" value={form.start_time} field="start_time" update={update} />
                <AllDayDateInput label="End" value={form.end_time} field="end_time" update={update} />
            </div>
        );
    }

    return (
        <div className="form-row">
            <DateTimeInput label="Start" value={form.start_time} field="start_time" update={update} />
            <DateTimeInput label="End" value={form.end_time} field="end_time" update={update} />
        </div>
    );
}

function DateTimeInput({ label, value, field, update }) {
    const isoValue = value
        ? (() => {
              const d = new Date(value);
              const pad = n => String(n).padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          })()
        : '';

    return (
        <div className="form-field">
            <label>{label}</label>
            <DateTimePicker
                value={isoValue}
                onChange={iso => update(field)({ target: { value: iso } })}
                placeholder={`Pick ${label.toLowerCase()} date & time`}
            />
        </div>
    );
}

function AllDayDateInput({ label, value, field, update }) {
    const dateValue = value ? value.split('T')[0] : '';
    return (
        <div className="form-field">
            <label>{label}</label>
            <input
                type="date"
                value={dateValue}
                onChange={e => {
                    const val = e.target.value ? e.target.value + 'T00:00' : '';
                    update(field)({ target: { value: val } });
                }}
            />
        </div>
    );
}
