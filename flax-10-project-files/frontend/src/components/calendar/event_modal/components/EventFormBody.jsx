import { FormField } from './FormField';
import { TagField } from './TagField';
import { RecurrenceField } from './RecurrenceField';
import { TimeRow } from './TimeRow';
import { ActionButtons } from './ActionButtons';
import { ReminderField } from './ReminderField';
import { LocationAutocomplete } from './LocationAutoComplete';
function Privacy({ value, onChange }) {
    const isP = value === true;
    return (
        <div className="form-field"><label>Visibility</label>
            <div className="privacy-toggle">
                <button type="button" className={`privacy-btn${!isP ? ' active' : ''}`} onClick={() => onChange(false)}>🌐 Public</button>
                <button type="button" className={`privacy-btn${isP ? ' active' : ''}`} onClick={() => onChange(true)}>🔒 Private</button>
            </div>
        </div>
    );
}
export function EventFormBody({ isEditing, form, setForm, onSubmit, onDelete, showReminder = true, tags }) {
    const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
    return (
        <form onSubmit={onSubmit}>
            <FormField label="Title" value={form.title} onChange={update('title')} required placeholder="e.g. Team Meeting" />
            <FormField label="Description (optional)" type="textarea" value={form.description} onChange={update('description')} placeholder="Add a description…" />
            <TagField value={form.tag} onChange={update('tag')} customTags={tags} />
            <Privacy value={form.is_private} onChange={(v) => set('is_private', v)} />
            <div className="form-field"><label>Location</label>
                <LocationAutocomplete value={form.location || ''} onChange={(v) => set('location', v)} placeholder='e.g. Strand Campus, London' />
            </div>
            <TimeRow form={form} update={update} setForm={setForm} recurrenceValue={form.recurrence} onRecurrenceChange={(r) => set('recurrence', r)} />
            <RecurrenceField value={form.recurrence} onChange={(r) => set('recurrence', r)} hideFrequency />
            {showReminder && <ReminderField value={form.reminder} onChange={(r) => set('reminder', r)} />}
            <ActionButtons onDelete={onDelete} />
        </form>
    );
}

