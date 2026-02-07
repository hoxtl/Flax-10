import { useEventForm } from './useEventForm';
import { useTags } from '../../../context/TagContext';
import './EventModal.css';

export function EventModal({ event, onClose, initialType }) {
    const { tags } = useTags();
    const defaultTag = tags.length > 0 ? tags[0].id : '';
    // If initialType is provided, use it. Otherwise use the first tag.
    // If editing an event, the event's tag will take precedence in useEventForm logic.
    const options = { initialTag: initialType || defaultTag };
    const logic = useEventForm(event, onClose, options);

    // Ensure form has a tag if it came back empty (edge case)
    if (!logic.form.tag && defaultTag) {
        // This is a bit of a hack, ideally useEventForm handles this, but since we control options...
        // Actually, let's rely on useEventForm initializing correctly with options.
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <ModalContent onClose={onClose} {...logic} />
        </div>
    );
}

function ModalContent({ onClose, isEditing, form, setForm, error, overlapWarning, handleSubmit, handleConfirmSave, handleCancelSave, handleDelete }) {
    return (
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <ModalHeader isEditing={isEditing} onClose={onClose} />
            {error && <div className="form-error">{error}</div>}
            {overlapWarning && <OverlapWarning events={overlapWarning} onConfirm={handleConfirmSave} onCancel={handleCancelSave} />}
            <EventFormBody form={form} setForm={setForm} isEditing={isEditing} onSubmit={handleSubmit} onDelete={handleDelete} />
        </div>
    );
}

function OverlapWarning({ events, onConfirm, onCancel }) {
    const names = events.map(e => e.title).join(', ');
    return (
        <div className="form-warning">
            <p><strong>⚠️ Overlap Warning</strong></p>
            <p>This event overlaps with: {names}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={onConfirm} className="submit-btn" style={{ flex: 1 }}>Continue Anyway</button>
                <button type="button" onClick={onCancel} className="delete-btn" style={{ flex: 1 }}>Cancel</button>
            </div>
        </div>
    );
}

function ModalHeader({ isEditing, onClose }) {
    return (
        <div className="modal-header">
            <h3>{isEditing ? 'Edit Event' : 'New Event'}</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
    );
}

function EventFormBody({ isEditing, form, setForm, onSubmit, onDelete }) {
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

function TimeRow({ form, update }) {
    return (
        <div className="form-row">
            <FormField label="Start" type="datetime-local" value={form.start_time} onChange={update('start_time')} required />
            <FormField label="End" type="datetime-local" value={form.end_time} onChange={update('end_time')} required />
        </div>
    );
}

function ActionButtons({ isEditing, onDelete }) {
    return (
        <div className="modal-actions">
            {isEditing && <button type="button" className="delete-btn" onClick={onDelete}>Delete</button>}
            <button type="submit" className="submit-btn">Save</button>
        </div>
    );
}

function TagField({ value, onChange }) {
    const { tags } = useTags();
    return (
        <div className="form-field">
            <label htmlFor="field-tag">Type</label>
            <select id="field-tag" value={value || ''} onChange={onChange}>
                {tags.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
        </div>
    );
}

function RecurrenceField({ value, onChange }) {
    return (
        <div className="form-field">
            <label htmlFor="field-recurrence">Recurrence</label>
            <select id="field-recurrence" value={value || 'none'} onChange={onChange}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
        </div>
    );
}

function FormField({ label, type = 'text', ...props }) {
    const id = `field-${label.toLowerCase()}`;
    const Component = type === 'textarea' ? 'textarea' : 'input';
    return (
        <div className="form-field">
            <label htmlFor={id}>{label}</label>
            <Component id={id} type={type} {...props} />
        </div>
    );
}
