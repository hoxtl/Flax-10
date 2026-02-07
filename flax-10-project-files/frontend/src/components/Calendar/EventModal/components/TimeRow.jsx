import { FormField } from './FormField';

export function TimeRow({ form, update }) {
    return (
        <div className="form-row">
            <FormField label="Start" type="datetime-local" value={form.start_time} onChange={update('start_time')} required />
            <FormField label="End" type="datetime-local" value={form.end_time} onChange={update('end_time')} required />
        </div>
    );
}
