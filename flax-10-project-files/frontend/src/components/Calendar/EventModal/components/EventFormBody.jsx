import { FormField } from './FormField';
import { TagField } from './TagField';
import { RecurrenceField } from './RecurrenceField';
import { TimeRow } from './TimeRow';
import { ActionButtons } from './ActionButtons';
import { ReminderField } from './ReminderField';
import { LocationAutocomplete } from './LocationAutoComplete';

function PrivacyToggle({ value, onChange }) {
    const isPrivate = value === true;
    return (
        <div className="form-field">
            <label>Visibility</label>
            <div className="privacy-toggle">
                <button
                    type="button"
                    className={`privacy-btn${!isPrivate ? ' active' : ''}`}
                    onClick={() => onChange(false)}
                >
                    🌐 Public
                </button>
                <button
                    type="button"
                    className={`privacy-btn${isPrivate ? ' active' : ''}`}
                    onClick={() => onChange(true)}
                >
                    🔒 Private
                </button>
            </div>
        </div>
    );
}

export function EventFormBody({ isEditing, form, setForm, onSubmit, onDelete, showReminder = true, tags }) {
    const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    const setRecurrence = (r) => setForm(f => ({ ...f, recurrence: r }));
    const setReminder = (r) => setForm(f => ({ ...f, reminder: r }));
    const setPrivacy = (val) => setForm(f => ({ ...f, is_private: val }));
    return (
        <form onSubmit={onSubmit}>
            <FormField label="Title" value={form.title} onChange={update('title')} required placeholder="e.g. Team Meeting" />
            <FormField label="Description (optional)" type="textarea" value={form.description} onChange={update('description')} placeholder="Add a description…" />
            <TagField value={form.tag} onChange={update('tag')} customTags={tags} />
            <PrivacyToggle value={form.is_private} onChange={setPrivacy} />
            
            <div className="form-field">
                <label>Location</label>
                <LocationAutocomplete
                    value={form.location || ''}
                    onChange={(value) => setForm(f => ({...f, location: value}))}
                    placeholder='e.g. Strand Campus, London'
                />
            </div>

            <TimeRow form={form} update={update} setForm={setForm} recurrenceValue={form.recurrence} onRecurrenceChange={setRecurrence} />
            <RecurrenceField value={form.recurrence} onChange={setRecurrence} hideFrequency />
            {showReminder && <ReminderField value={form.reminder} onChange={setReminder} />}
            <ActionButtons onDelete={onDelete} />
        </form>
    );
}

