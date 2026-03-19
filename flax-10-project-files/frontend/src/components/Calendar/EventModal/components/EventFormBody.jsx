/**
 * EventFormBody - Main form content for event creation/editing.
 * Includes fields for title, description, tags, time, recurrence, and privacy.
 */
import { FormField } from './FormField';
import { TagField } from './TagField';
import { RecurrenceField } from './RecurrenceField';
import { TimeRow } from './TimeRow';
import { ActionButtons } from './ActionButtons';
import { ReminderField } from './ReminderField';
import { LocationAutocomplete } from './LocationAutoComplete';

function PrivacyButton({ isActive, label, onClick }) {
    return (
        <button type="button" className={`privacy-btn${isActive ? ' active' : ''}`} onClick={onClick}>
            {label}
        </button>
    );
}

function PrivacyToggle({ value, onChange }) {
    const isPrivate = value === true;
    return (
        <div className="form-field">
            <label>Visibility</label>
            <div className="privacy-toggle">
                <PrivacyButton isActive={!isPrivate} label="🌐 Public" onClick={() => onChange(false)} />
                <PrivacyButton isActive={isPrivate} label="🔒 Private" onClick={() => onChange(true)} />
            </div>
        </div>
    );
}

/** Form body component with all event input fields and submit action. */
export function EventFormBody({ isEditing, form, setForm, onSubmit, onDelete, showReminder = true, tags }) {
    const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    const setRecurrence = (r) => setForm(f => ({ ...f, recurrence: r }));
    const setReminder = (r) => setForm(f => ({ ...f, reminder: r }));
    const setPrivacy = (val) => setForm(f => ({ ...f, is_private: val }));
    return (
        <form onSubmit={onSubmit}>
            <FormField label="Title" value={form.title} onChange={update('title')} required />
            <FormField label="Description" type="textarea" value={form.description} onChange={update('description')} />
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

            <TimeRow form={form} update={update} setForm={setForm} />
            <RecurrenceField value={form.recurrence} onChange={setRecurrence} />
            {showReminder && <ReminderField value={form.reminder} onChange={setReminder} />}
            <ActionButtons onDelete={onDelete} />
        </form>
    );
}

