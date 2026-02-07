import { FormField } from './FormField';
import { TagField } from './TagField';
import { RecurrenceField } from './RecurrenceField';
import { TimeRow } from './TimeRow';
import { ActionButtons } from './ActionButtons';

export function EventFormBody({ isEditing, form, setForm, onSubmit, onDelete }) {
    const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    return (
        <form onSubmit={onSubmit}>
            <FormField label="Title" value={form.title} onChange={update('title')} required />
            <FormField label="Description" type="textarea" value={form.description} onChange={update('description')} />
            <TagField value={form.tag} onChange={update('tag')} />
            <FormField label="Location" value={form.location} onChange={update('location')} placeholder="e.g. Room 214" />
            <TimeRow form={form} update={update} />
            <RecurrenceField value={form.recurrence} onChange={update('recurrence')} />
            <ActionButtons isEditing={isEditing} onDelete={onDelete} />
        </form>
    );
}
